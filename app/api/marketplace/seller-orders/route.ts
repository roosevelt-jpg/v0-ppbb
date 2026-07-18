import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getAdminDb, getAdminBucket } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { sendPushToUser } from '@/lib/push-notifications-server'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'
import {
  generateMarketplaceInvoicePdf,
  buildInvoiceNumber,
} from '@/lib/marketplace-invoice'
import type { MarketplaceAddress, MarketplacePaymentMethod } from '@/lib/marketplace-shipping'

async function assertSellerOwnsOrder(uid: string, orderData: Record<string, unknown>) {
  const businessId = String(orderData.businessId || '')
  if (businessId && (businessId === uid || orderData.sellerUserId === uid)) return true
  if (businessId) {
    const biz = await getAdminDb().collection('businesses').doc(businessId).get()
    const d = biz.data() || {}
    const owners = [d.ownerId, d.userId, d.createdBy, businessId].filter(Boolean)
    if (owners.includes(uid)) return true
  }
  return false
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }
    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const db = getAdminDb()
    // businessId is typically the shop owner's user id on this platform
    const byBiz = await db.collection('orders').where('businessId', '==', uid).limit(100).get()

    const orders = byBiz.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((o) => String((o as { type?: string }).type || '') === 'marketplace')
      .sort((a, b) => {
        const aT =
          (a as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
        const bT =
          (b as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
        return bT - aT
      })

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('[marketplace/seller-orders] GET:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load orders' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }
    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const orderId = String(body.orderId || '')
    const action = String(body.action || '')
    if (!orderId || !action) {
      return NextResponse.json({ success: false, error: 'orderId and action required' }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection('orders').doc(orderId)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
    const data = snap.data() || {}
    const owns = await assertSellerOwnsOrder(uid, data)
    if (!owns) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    const now = Timestamp.now()
    const patch: Record<string, unknown> = { updatedAt: now }

    if (action === 'arrange_pickup') {
      patch.fulfillmentStatus = 'pickup_arranged'
      patch.status = 'processing'
      patch.pickupArrangedAt = now
      patch.sellerNotes = typeof body.notes === 'string' ? body.notes : null
    } else if (action === 'mark_shipped') {
      patch.fulfillmentStatus = 'shipped'
      patch.status = 'shipped'
      patch.shippedAt = now
      if (typeof body.trackingNumber === 'string' && body.trackingNumber.trim()) {
        patch.trackingNumber = body.trackingNumber.trim()
      }
    } else if (action === 'mark_delivered') {
      patch.fulfillmentStatus = 'delivered'
      patch.status = 'delivered'
      patch.deliveredAt = now
      if (data.paymentMethod === 'cod') {
        patch.paymentStatus = 'paid'
      }
    } else if (action === 'confirm_bank_transfer') {
      patch.paymentStatus = 'paid'
      patch.bankTransferConfirmedAt = now
      // generate receipt if missing
      if (!data.receiptUrl && data.invoiceAddress) {
        try {
          const receiptBytes = generateMarketplaceInvoicePdf({
            documentType: 'receipt',
            orderId,
            invoiceNumber: buildInvoiceNumber(orderId, 'receipt'),
            issuedAt: new Date(),
            offerTitle: String(data.offerTitle || 'Order'),
            amount: Number(data.amount || data.total || 0),
            currency: String(data.currency || 'AED'),
            paymentMethod: (data.paymentMethod || 'bank_transfer') as MarketplacePaymentMethod,
            paymentStatus: 'paid',
            deliveryPartnerLabel: String(data.deliveryPartnerLabel || ''),
            shopName: String(data.shopName || ''),
            shopAddress: String(data.shopAddress || ''),
            shopEmail: '',
            shopPhone: '',
            platformName: 'Passive Blessings',
            platformAddress: 'Dubai, United Arab Emirates',
            buyerName: String((data.invoiceAddress as MarketplaceAddress)?.fullName || ''),
            buyerEmail: '',
            invoiceAddress: data.invoiceAddress as MarketplaceAddress,
            deliveryAddress: (data.deliveryAddress || data.invoiceAddress) as MarketplaceAddress,
          })
          const bucket = getAdminBucket()
          const path = `marketplace-orders/${orderId}/receipt.pdf`
          const file = bucket.file(path)
          await file.save(Buffer.from(receiptBytes), {
            contentType: 'application/pdf',
            metadata: { cacheControl: 'private, max-age=0' },
          })
          try {
            await file.makePublic()
          } catch {
            /* ignore */
          }
          patch.receiptUrl = `https://storage.googleapis.com/${bucket.name}/${path}`
        } catch (err) {
          console.error('[seller-orders] receipt gen failed:', err)
        }
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }

    await ref.update(sanitizeForFirestore(patch))

    const buyerId = String(data.userId || '')
    if (buyerId) {
      const titles: Record<string, string> = {
        arrange_pickup: 'Shop arranged delivery pickup',
        mark_shipped: 'Your order has shipped',
        mark_delivered: 'Order delivered',
        confirm_bank_transfer: 'Bank transfer confirmed',
      }
      const purposes: Record<string, string> = {
        arrange_pickup: 'Marketplace pickup arrangement',
        mark_shipped: 'Marketplace shipping update',
        mark_delivered: 'Marketplace delivery confirmation',
        confirm_bank_transfer: 'Marketplace payment confirmation',
      }
      const offerTitle = String(data.offerTitle || 'Your marketplace order')
      void sendPushToUser(
        buyerId,
        {
          title: titles[action] || 'Order update',
          body: offerTitle,
        },
        { type: 'marketplace_order_update', orderId, click_action: '/dashboard/orders' }
      ).catch(console.error)

      const site = (
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://www.passive-blessings.com'
      ).replace(/\/$/, '')
      sendBrandedEmailToUserSafe({
        userId: buyerId,
        subject: titles[action] || 'Order update',
        purpose: purposes[action] || 'Marketplace order update',
        headline: titles[action] || 'Order update',
        bodyHtml: paragraphs(
          'Assalamu alaikum,',
          `Your order for “${offerTitle}” has been updated.`,
          titles[action] || 'Please check your orders for details.'
        ),
        cta: { label: 'View my orders', url: `${site}/dashboard/orders` },
      })
    }

    return NextResponse.json({ success: true, orderId, ...patch })
  } catch (error) {
    console.error('[marketplace/seller-orders] PATCH:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
