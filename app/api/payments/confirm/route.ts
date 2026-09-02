import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/get-stripe-client'
import { completeMembershipPayment, completeEventTicketPayment } from '@/lib/payment-completion'
import { getAdminDb } from '@/lib/firebase-admin'
import { completeMarketplacePurchase } from '@/lib/marketplace-purchase-server'
import type { MarketplaceAddress, MarketplacePaymentMethod } from '@/lib/marketplace-shipping'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Confirm embedded Stripe card payment after client-side confirmCardPayment succeeds. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paymentIntentId = String(body.paymentIntentId || '').trim()
    const type = String(body.type || '').trim()

    if (!paymentIntentId) {
      return NextResponse.json({ success: false, error: 'paymentIntentId required' }, { status: 400 })
    }

    const stripe = await getStripeClient()
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (pi.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, error: 'Payment has not completed yet.' },
        { status: 400 }
      )
    }

    const meta = pi.metadata || {}

    if (type === 'membership' || meta.type === 'membership') {
      const userId = String(body.userId || meta.userId || '')
      const planId = String(body.planId || meta.planId || '')
      const subscriptionId = String(body.subscriptionId || meta.subscriptionId || paymentIntentId)

      if (!userId || !planId) {
        return NextResponse.json({ success: false, error: 'Missing membership context' }, { status: 400 })
      }

      const result = await completeMembershipPayment({
        userId,
        planId,
        gateway: 'stripe',
        paymentReference: subscriptionId,
        amountCents: pi.amount_received || pi.amount,
        currency: pi.currency,
      })

      return NextResponse.json({ success: true, membershipUrl: result.membershipUrl })
    }

    if (type === 'marketplace' || meta.type === 'marketplace') {
      const orderId = String(body.orderId || meta.orderId || '')
      const offerId = String(meta.offerId || '')
      const userId = String(meta.userId || '')

      if (!offerId || !userId) {
        return NextResponse.json({ success: false, error: 'Missing marketplace context' }, { status: 400 })
      }

      const db = getAdminDb()
      let pendingData: Record<string, unknown> = {}
      if (orderId) {
        const orderSnap = await db.collection('orders').doc(orderId).get()
        pendingData = orderSnap.data() || {}
      }

      const result = await completeMarketplacePurchase({
        offerId,
        buyerId: userId,
        mode: 'purchase',
        paymentReference: paymentIntentId,
        paymentGateway: 'stripe',
        paymentMethod: (pendingData.paymentMethod as MarketplacePaymentMethod) || 'card',
        orderId: orderId || undefined,
        invoiceAddress: (pendingData.invoiceAddress as MarketplaceAddress) || undefined,
        deliveryAddress: (pendingData.deliveryAddress as MarketplaceAddress) || undefined,
      })

      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        invoiceUrl: result.invoiceUrl,
        receiptUrl: result.receiptUrl,
      })
    }

    if (type === 'event_ticket' || meta.type === 'event_ticket') {
      const registrationId = String(body.registrationId || meta.registrationId || '')
      const eventId = String(meta.eventId || '')
      if (!registrationId || !eventId) {
        return NextResponse.json({ success: false, error: 'Missing event registration context' }, { status: 400 })
      }

      const result = await completeEventTicketPayment({
        registrationId,
        eventId,
        paymentReference: paymentIntentId,
        gateway: 'stripe',
        amountMajor: (pi.amount_received || pi.amount) / 100,
        ticketTypeId: meta.ticketTypeId,
        couponCode: meta.couponCode,
        userId: meta.userId,
      })

      return NextResponse.json({ success: true, confirmationUrl: result.confirmationUrl })
    }

    if (type === 'advertising' || meta.type === 'advertising') {
      const advertisingRequestId = String(body.advertisingRequestId || meta.advertisingRequestId || '')
      if (!advertisingRequestId) {
        return NextResponse.json({ success: false, error: 'Missing advertising request' }, { status: 400 })
      }

      const db = getAdminDb()
      await db
        .collection('advertisingRequests')
        .doc(advertisingRequestId)
        .set(
          {
            status: 'paid',
            paidAt: Timestamp.now(),
            stripePaymentIntentId: paymentIntentId,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unknown payment type' }, { status: 400 })
  } catch (error) {
    console.error('[payments/confirm]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Confirmation failed' },
      { status: 500 }
    )
  }
}
