import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sendPushToUser } from '@/lib/push-notifications-server'

export async function POST(request: NextRequest) {
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
    const offerId = String(body.offerId || '')
    const mode = body.mode === 'enquire' ? 'enquire' : 'purchase'

    if (!offerId) {
      return NextResponse.json({ success: false, error: 'offerId required' }, { status: 400 })
    }

    const db = getAdminDb()
    let offerSnap = await db.collection('offers').doc(offerId).get()
    if (!offerSnap.exists) {
      offerSnap = await db.collection('businessOffers').doc(offerId).get()
    }
    if (!offerSnap.exists) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
    }

    const offer = offerSnap.data() || {}
    const businessId = String(offer.businessId || '')
    const title = String(offer.title || 'Listing')
    const amount = typeof offer.price === 'number' ? offer.price : 0
    const currency = String(offer.currency || 'AED')

    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data() || {}
    const buyerName =
      `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
      String(userData.displayName || 'Member')
    const buyerEmail = String(userData.email || '')

    const now = Timestamp.now()
    const purchaseRef = db.collection('offers').doc(offerId).collection('purchases').doc()
    const orderRef = db.collection('orders').doc()

    const purchase = sanitizeForFirestore({
      buyerId: uid,
      buyerName,
      buyerEmail,
      purchasedAt: now,
      amount: mode === 'enquire' ? 0 : amount,
      currency,
      paymentReference: body.paymentReference || `manual_${Date.now()}`,
      paymentGateway: body.paymentGateway || 'direct',
      mode,
    })

    await purchaseRef.set(purchase)
    await orderRef.set(
      sanitizeForFirestore({
        userId: uid,
        businessId,
        offerId,
        offerTitle: title,
        amount: mode === 'enquire' ? 0 : amount,
        currency,
        status: mode === 'enquire' ? 'enquiry' : 'completed',
        type: 'marketplace',
        createdAt: now,
      })
    )

    if (db.collection('offers').doc(offerId).path) {
      try {
        await db.collection('offers').doc(offerId).update({
          purchaseCount: FieldValue.increment(1),
          updatedAt: now,
        })
      } catch {
        /* legacy-only offer */
      }
    }
    try {
      await db.collection('businessOffers').doc(offerId).update({
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
        leadUserId: uid,
        convertedToCustomer: mode === 'purchase',
        conversionValue: mode === 'purchase' ? amount : null,
        createdAt: now,
        updatedAt: now,
      })
      await db.collection('businessLeads').add(leadPayload)
      await db.collection('leads').add(leadPayload)

      void sendPushToUser(
        businessId,
        {
          title: mode === 'enquire' ? 'New enquiry' : 'New purchase',
          body: `${buyerName}: ${title}`,
        },
        {
          type: mode === 'enquire' ? 'marketplace_purchase' : 'marketplace_purchase',
          offerId,
          click_action: '/business/leads',
        }
      ).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      purchaseId: purchaseRef.id,
      orderId: orderRef.id,
    })
  } catch (error) {
    console.error('[marketplace/purchase] error:', error)
    return NextResponse.json({ success: false, error: 'Purchase failed' }, { status: 500 })
  }
}
