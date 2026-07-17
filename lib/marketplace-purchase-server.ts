import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { sendPushToUser } from '@/lib/push-notifications-server'
import { recordReferralConversion } from '@/lib/referral-conversion-server'

export type MarketplacePurchaseMode = 'purchase' | 'enquire'

export interface CompleteMarketplacePurchaseParams {
  offerId: string
  buyerId: string
  mode: MarketplacePurchaseMode
  paymentReference?: string
  paymentGateway?: string
  orderId?: string
  stripeSessionId?: string
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
): Promise<{ purchaseId: string; orderId: string; sellerUserId: string | null }> {
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

  const purchase = sanitizeForFirestore({
    buyerId: params.buyerId,
    buyerName,
    buyerEmail,
    purchasedAt: now,
    amount: mode === 'enquire' ? 0 : amount,
    currency,
    paymentReference: params.paymentReference || `manual_${Date.now()}`,
    paymentGateway: params.paymentGateway || 'direct',
    stripeSessionId: params.stripeSessionId || null,
    mode,
  })

  await purchaseRef.set(purchase)
  await orderRef.set(
    sanitizeForFirestore({
      userId: params.buyerId,
      businessId,
      offerId: params.offerId,
      offerTitle: title,
      amount: mode === 'enquire' ? 0 : amount,
      currency,
      status: mode === 'enquire' ? 'enquiry' : 'completed',
      type: 'marketplace',
      paymentReference: params.paymentReference || null,
      paymentGateway: params.paymentGateway || 'direct',
      stripeSessionId: params.stripeSessionId || null,
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

  let sellerUserId: string | null = null
  if (businessId) {
    try {
      const bizSnap = await db.collection('businesses').doc(businessId).get()
      const biz = bizSnap.data() || {}
      sellerUserId =
        (typeof biz.ownerId === 'string' && biz.ownerId) ||
        (typeof biz.userId === 'string' && biz.userId) ||
        (typeof biz.createdBy === 'string' && biz.createdBy) ||
        (typeof offer.ownerId === 'string' && offer.ownerId) ||
        (typeof offer.createdBy === 'string' && offer.createdBy) ||
        null
    } catch {
      sellerUserId =
        (typeof offer.ownerId === 'string' && offer.ownerId) ||
        (typeof offer.createdBy === 'string' && offer.createdBy) ||
        null
    }

    const leadPayload = sanitizeForFirestore({
      businessId,
      sourceType: mode === 'enquire' ? 'message' : 'offer_view',
      leadSource: mode === 'enquire' ? 'message' : 'offer_view',
      leadUserId: params.buyerId,
      convertedToCustomer: mode === 'purchase',
      conversionValue: mode === 'purchase' ? amount : null,
      createdAt: now,
      updatedAt: now,
    })
    await db.collection('businessLeads').add(leadPayload)
    await db.collection('leads').add(leadPayload)

    const pushTarget = sellerUserId || businessId
    void sendPushToUser(
      pushTarget,
      {
        title: mode === 'enquire' ? 'New enquiry' : 'New purchase',
        body: `${buyerName}: ${title}`,
      },
      {
        type: 'marketplace_purchase',
        offerId: params.offerId,
        click_action: mode === 'enquire' ? '/business/messages' : '/business/leads',
      }
    ).catch(console.error)
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

  return { purchaseId: purchaseRef.id, orderId: orderRef.id, sellerUserId }
}

export async function createPendingMarketplaceOrder(params: {
  offerId: string
  buyerId: string
  stripeSessionId: string
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
      stripeSessionId: params.stripeSessionId,
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
