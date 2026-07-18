import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb, getAdminBucket } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { sendPushToUser } from '@/lib/push-notifications-server'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'
import { recordReferralConversion } from '@/lib/referral-conversion-server'
import {
  buildInvoiceNumber,
  generateMarketplaceInvoicePdf,
} from '@/lib/marketplace-invoice'
import {
  deliveryPartnerLabel,
  type MarketplaceAddress,
  type MarketplaceDeliveryPartnerId,
  type MarketplacePaymentMethod,
} from '@/lib/marketplace-shipping'

export type MarketplacePurchaseMode = 'purchase' | 'enquire'

export interface CompleteMarketplacePurchaseParams {
  offerId: string
  buyerId: string
  mode: MarketplacePurchaseMode
  paymentReference?: string
  paymentGateway?: string
  paymentMethod?: MarketplacePaymentMethod
  orderId?: string
  stripeSessionId?: string
  invoiceAddress?: MarketplaceAddress
  deliveryAddress?: MarketplaceAddress
  /** When true, COD / bank transfer — awaiting fulfillment, not yet "paid" */
  awaitingFulfillment?: boolean
}

function shopAddressFromBusiness(biz: Record<string, unknown>): string {
  const shipping = biz.shipping as { shopAddress?: MarketplaceAddress } | undefined
  if (shipping?.shopAddress?.line1) {
    const a = shipping.shopAddress
    return [a.line1, a.line2, a.city, a.emirate, a.postalCode, a.country || 'UAE']
      .filter(Boolean)
      .join(', ')
  }
  const loc = biz.location
  if (typeof loc === 'string' && loc.trim()) return loc.trim()
  if (loc && typeof loc === 'object') {
    const l = loc as Record<string, unknown>
    return [l.address, l.city, l.emirate, l.postalCode, 'UAE'].filter(Boolean).join(', ')
  }
  const city = typeof biz.city === 'string' ? biz.city : ''
  const emirate = typeof biz.emirate === 'string' ? biz.emirate : ''
  return [city, emirate, 'United Arab Emirates'].filter(Boolean).join(', ') || 'United Arab Emirates'
}

async function uploadOrderPdf(
  orderId: string,
  kind: 'invoice' | 'receipt',
  bytes: Uint8Array
): Promise<string> {
  const bucket = getAdminBucket()
  const path = `marketplace-orders/${orderId}/${kind}.pdf`
  const file = bucket.file(path)
  await file.save(Buffer.from(bytes), {
    contentType: 'application/pdf',
    metadata: { cacheControl: 'private, max-age=0' },
  })
  try {
    await file.makePublic()
  } catch {
    /* bucket may already be public or IAM-managed */
  }
  return `https://storage.googleapis.com/${bucket.name}/${path}`
}

export async function loadMarketplaceOffer(offerId: string) {
  const db = getAdminDb()
  let snap = await db.collection('offers').doc(offerId).get()
  if (!snap.exists) {
    snap = await db.collection('businessOffers').doc(offerId).get()
  }
  if (!snap.exists) return null
  return { id: snap.id, data: snap.data() || {} }
}

export async function completeMarketplacePurchase(
  params: CompleteMarketplacePurchaseParams
): Promise<{
  purchaseId: string
  orderId: string
  sellerUserId: string | null
  invoiceUrl: string | null
  receiptUrl: string | null
  bankTransferDetails: Record<string, string> | null
}> {
  const db = getAdminDb()
  const offerRow = await loadMarketplaceOffer(params.offerId)
  if (!offerRow) {
    throw new Error('Offer not found')
  }

  const offer = offerRow.data
  const businessId = String(offer.businessId || '')
  const title = String(offer.title || 'Listing')
  const amount = typeof offer.price === 'number' ? offer.price : 0
  const currency = String(offer.currency || 'AED')
  const mode = params.mode
  const paymentMethod: MarketplacePaymentMethod =
    params.paymentMethod ||
    (params.paymentGateway === 'stripe' ? 'card' : params.paymentGateway === 'cod' ? 'cod' : params.paymentGateway === 'bank_transfer' ? 'bank_transfer' : 'card')

  const userSnap = await db.collection('users').doc(params.buyerId).get()
  const userData = userSnap.data() || {}
  const buyerName =
    `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
    String(userData.displayName || 'Member')
  const buyerEmail = String(userData.email || '')

  const now = Timestamp.now()
  const purchaseRef = db.collection('offers').doc(params.offerId).collection('purchases').doc()
  const orderRef = params.orderId
    ? db.collection('orders').doc(params.orderId)
    : db.collection('orders').doc()

  let shopName = String(offer.businessName || 'Shop')
  let shopAddress = 'United Arab Emirates'
  let shopEmail = ''
  let shopPhone = ''
  let preferredDeliveryPartner: MarketplaceDeliveryPartnerId | string = 'self_arrange'
  let preferredDeliveryPartnerName = ''
  let sellerUserId: string | null = null

  if (businessId) {
    try {
      const bizSnap = await db.collection('businesses').doc(businessId).get()
      const biz = (bizSnap.data() || {}) as Record<string, unknown>
      shopName = String(biz.businessName || biz.name || shopName)
      shopAddress = shopAddressFromBusiness(biz)
      shopEmail = String(biz.email || biz.businessEmail || '')
      shopPhone = String(biz.phone || biz.businessPhone || '')
      const shipping = biz.shipping as
        | {
            preferredDeliveryPartner?: string
            preferredDeliveryPartnerName?: string
          }
        | undefined
      preferredDeliveryPartner = shipping?.preferredDeliveryPartner || 'self_arrange'
      preferredDeliveryPartnerName = shipping?.preferredDeliveryPartnerName || ''
      sellerUserId =
        (typeof biz.ownerId === 'string' && biz.ownerId) ||
        (typeof biz.userId === 'string' && biz.userId) ||
        (typeof biz.createdBy === 'string' && biz.createdBy) ||
        null
    } catch {
      /* ignore */
    }
  }
  if (!sellerUserId) {
    sellerUserId =
      (typeof offer.ownerId === 'string' && offer.ownerId) ||
      (typeof offer.createdBy === 'string' && offer.createdBy) ||
      null
  }

  const invoiceAddress =
    params.invoiceAddress ||
    ({
      fullName: buyerName,
      phone: String(userData.phone || ''),
      line1: '',
      city: '',
      emirate: 'Dubai',
      country: 'United Arab Emirates',
    } satisfies MarketplaceAddress)

  const deliveryAddress = params.deliveryAddress || invoiceAddress

  const status =
    mode === 'enquire'
      ? 'enquiry'
      : params.awaitingFulfillment || paymentMethod === 'cod' || paymentMethod === 'bank_transfer'
        ? 'awaiting_fulfillment'
        : 'processing'

  const paymentStatus =
    mode === 'enquire'
      ? 'n/a'
      : paymentMethod === 'card' && !params.awaitingFulfillment
        ? 'paid'
        : paymentMethod === 'cod'
          ? 'cod_pending'
          : paymentMethod === 'bank_transfer'
            ? 'awaiting_bank_transfer'
            : 'pending'

  const partnerLabel = deliveryPartnerLabel(
    preferredDeliveryPartner,
    preferredDeliveryPartnerName
  )

  const purchase = sanitizeForFirestore({
    buyerId: params.buyerId,
    buyerName,
    buyerEmail,
    purchasedAt: now,
    amount: mode === 'enquire' ? 0 : amount,
    currency,
    paymentReference: params.paymentReference || `order_${Date.now()}`,
    paymentGateway: params.paymentGateway || paymentMethod,
    paymentMethod,
    stripeSessionId: params.stripeSessionId || null,
    mode,
    invoiceAddress,
    deliveryAddress,
  })

  await purchaseRef.set(purchase)

  let invoiceUrl: string | null = null
  let receiptUrl: string | null = null

  if (mode === 'purchase') {
    try {
      const platformSnap = await db.collection('platformConfig').doc('global').get()
      const platform = platformSnap.data() || {}
      const platformName = String(platform.siteName || platform.organizationName || 'Passive Blessings')
      const platformAddress = String(platform.address || 'Dubai, United Arab Emirates')

      const baseDoc = {
        orderId: orderRef.id,
        invoiceNumber: buildInvoiceNumber(orderRef.id, 'invoice'),
        issuedAt: new Date(),
        offerTitle: title,
        amount,
        currency,
        paymentMethod,
        paymentStatus,
        deliveryPartnerLabel: partnerLabel,
        shopName,
        shopAddress,
        shopEmail,
        shopPhone,
        platformName,
        platformAddress,
        buyerName,
        buyerEmail,
        invoiceAddress,
        deliveryAddress,
      }

      const invoiceBytes = generateMarketplaceInvoicePdf({
        ...baseDoc,
        documentType: 'invoice',
        invoiceNumber: buildInvoiceNumber(orderRef.id, 'invoice'),
      })
      invoiceUrl = await uploadOrderPdf(orderRef.id, 'invoice', invoiceBytes)

      if (paymentStatus === 'paid') {
        const receiptBytes = generateMarketplaceInvoicePdf({
          ...baseDoc,
          documentType: 'receipt',
          invoiceNumber: buildInvoiceNumber(orderRef.id, 'receipt'),
        })
        receiptUrl = await uploadOrderPdf(orderRef.id, 'receipt', receiptBytes)
      }
    } catch (err) {
      console.error('[marketplace] invoice generation failed:', err)
    }
  }

  await orderRef.set(
    sanitizeForFirestore({
      userId: params.buyerId,
      businessId,
      offerId: params.offerId,
      offerTitle: title,
      amount: mode === 'enquire' ? 0 : amount,
      currency,
      status,
      fulfillmentStatus: mode === 'enquire' ? 'n/a' : 'awaiting_shop_pickup',
      type: 'marketplace',
      paymentReference: params.paymentReference || null,
      paymentGateway: params.paymentGateway || paymentMethod,
      paymentMethod,
      paymentStatus,
      stripeSessionId: params.stripeSessionId || null,
      invoiceAddress,
      deliveryAddress,
      shopName,
      shopAddress,
      preferredDeliveryPartner,
      preferredDeliveryPartnerName: preferredDeliveryPartnerName || null,
      deliveryPartnerLabel: partnerLabel,
      invoiceUrl,
      receiptUrl,
      invoiceNumber: buildInvoiceNumber(orderRef.id, 'invoice'),
      items: [
        {
          title,
          quantity: 1,
          price: mode === 'enquire' ? 0 : amount,
        },
      ],
      total: mode === 'enquire' ? 0 : amount,
      createdAt: now,
      updatedAt: now,
    }),
    { merge: true }
  )

  try {
    await db.collection('offers').doc(params.offerId).update({
      purchaseCount: FieldValue.increment(1),
      updatedAt: now,
    })
  } catch {
    /* legacy-only offer */
  }
  try {
    await db.collection('businessOffers').doc(params.offerId).update({
      conversions: FieldValue.increment(1),
      updatedAt: now,
    })
  } catch {
    /* canonical-only offer */
  }

  if (businessId) {
    const leadPayload = sanitizeForFirestore({
      businessId,
      sourceType: mode === 'enquire' ? 'message' : 'offer_view',
      leadSource: mode === 'enquire' ? 'message' : 'offer_view',
      leadUserId: params.buyerId,
      convertedToCustomer: mode === 'purchase',
      conversionValue: mode === 'purchase' ? amount : null,
      orderId: orderRef.id,
      paymentMethod: mode === 'purchase' ? paymentMethod : null,
      deliveryPartner: preferredDeliveryPartner,
      createdAt: now,
      updatedAt: now,
    })
    await db.collection('businessLeads').add(leadPayload)
    await db.collection('leads').add(leadPayload)

    const pushTarget = sellerUserId || businessId
    const payNote =
      paymentMethod === 'cod'
        ? 'COD — arrange pickup with your delivery partner'
        : paymentMethod === 'bank_transfer'
          ? 'Bank transfer — confirm payment then arrange delivery'
          : 'Paid by card — arrange pickup with your delivery partner'
    void sendPushToUser(
      pushTarget,
      {
        title: mode === 'enquire' ? 'New enquiry' : 'New marketplace order',
        body:
          mode === 'enquire'
            ? `${buyerName}: ${title}`
            : `${buyerName} ordered “${title}”. ${payNote}. Partner: ${partnerLabel}.`,
      },
      {
        type: 'marketplace_purchase',
        offerId: params.offerId,
        orderId: orderRef.id,
        click_action: mode === 'enquire' ? '/business/messages' : '/business/orders',
      }
    ).catch(console.error)

    const site = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.passive-blessings.com'
    ).replace(/\/$/, '')

    sendBrandedEmailToUserSafe({
      userId: pushTarget,
      subject: mode === 'enquire' ? 'New marketplace enquiry' : 'New marketplace order',
      purpose: mode === 'enquire' ? 'Marketplace enquiry notification' : 'Marketplace order notification',
      headline: mode === 'enquire' ? 'New enquiry' : 'New order',
      bodyHtml: paragraphs(
        'Assalamu alaikum,',
        mode === 'enquire'
          ? `${buyerName} sent an enquiry about “${title}”.`
          : `${buyerName} ordered “${title}”. ${payNote}. Delivery partner preference: ${partnerLabel}.`,
        'Please review this in your business orders or messages.'
      ),
      cta: {
        label: mode === 'enquire' ? 'Open messages' : 'Open orders',
        url: `${site}${mode === 'enquire' ? '/business/messages' : '/business/orders'}`,
      },
    })

    if (mode === 'purchase' && params.buyerId) {
      sendBrandedEmailToUserSafe({
        userId: params.buyerId,
        subject: `Order confirmed: ${title}`,
        purpose: 'Marketplace order confirmation',
        headline: 'Order confirmed',
        bodyHtml: paragraphs(
          'Assalamu alaikum,',
          `Your order for “${title}” from ${shopName} has been placed.`,
          payNote,
          `Preferred delivery partner: ${partnerLabel}.`
        ),
        cta: { label: 'View my orders', url: `${site}/dashboard/orders` },
      })
    }
  }

  if (mode === 'purchase' && amount > 0) {
    void recordReferralConversion({
      convertedUserId: params.buyerId,
      conversionType: 'purchase',
      relatedDocId: orderRef.id,
      revenueAmount: amount,
      status: 'confirmed',
      idempotencyKey: `purchase:${orderRef.id}`,
    }).catch((err) => console.error('[referral] marketplace conversion:', err))
  }

  let bankTransferDetails: Record<string, string> | null = null
  if (paymentMethod === 'bank_transfer' && businessId) {
    try {
      const bizSnap = await db.collection('businesses').doc(businessId).get()
      const bt = (bizSnap.data()?.bankTransfer || {}) as Record<string, string>
      if (bt.iban || bt.accountNumber || bt.bankName) {
        bankTransferDetails = {
          bankName: bt.bankName || '',
          accountName: bt.accountName || '',
          iban: bt.iban || '',
          accountNumber: bt.accountNumber || '',
          notes: bt.notes || '',
          shopName,
        }
      }
    } catch {
      /* ignore */
    }
  }

  return {
    purchaseId: purchaseRef.id,
    orderId: orderRef.id,
    sellerUserId,
    invoiceUrl,
    receiptUrl,
    bankTransferDetails,
  }
}

export async function createPendingMarketplaceOrder(params: {
  offerId: string
  buyerId: string
  stripeSessionId: string
  invoiceAddress?: MarketplaceAddress
  deliveryAddress?: MarketplaceAddress
  paymentMethod?: MarketplacePaymentMethod
}) {
  const db = getAdminDb()
  const offerRow = await loadMarketplaceOffer(params.offerId)
  if (!offerRow) throw new Error('Offer not found')

  const offer = offerRow.data
  const amount = typeof offer.price === 'number' ? offer.price : 0
  const now = Timestamp.now()
  const orderRef = db.collection('orders').doc()

  await orderRef.set(
    sanitizeForFirestore({
      userId: params.buyerId,
      businessId: String(offer.businessId || ''),
      offerId: params.offerId,
      offerTitle: String(offer.title || 'Listing'),
      amount,
      currency: String(offer.currency || 'AED'),
      status: 'pending_payment',
      type: 'marketplace',
      paymentGateway: 'stripe',
      paymentMethod: params.paymentMethod || 'card',
      stripeSessionId: params.stripeSessionId,
      invoiceAddress: params.invoiceAddress || null,
      deliveryAddress: params.deliveryAddress || null,
      createdAt: now,
      updatedAt: now,
    })
  )

  return orderRef.id
}

export async function findPendingOrderByStripeSession(sessionId: string) {
  const db = getAdminDb()
  const snap = await db
    .collection('orders')
    .where('stripeSessionId', '==', sessionId)
    .limit(1)
    .get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, data: doc.data() }
}
