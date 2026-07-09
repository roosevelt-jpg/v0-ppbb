import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getStripeClient } from '@/lib/get-stripe-client'
import {
  findPendingOrderByStripeSession,
} from '@/lib/marketplace-purchase-server'
import {
  handleMarketplaceCheckoutCompleted,
  isCheckoutSessionProcessed,
  markCheckoutSessionProcessed,
} from '@/lib/stripe-webhook-marketplace'

/** Fallback when webhook is delayed — verify Stripe session and complete order. */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const sessionId = String(body.sessionId || '')
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId required' }, { status: 400 })
    }

    if (await isCheckoutSessionProcessed(sessionId)) {
      const pending = await findPendingOrderByStripeSession(sessionId)
      return NextResponse.json({ success: true, alreadyProcessed: true, orderId: pending?.id })
    }

    const stripe = await getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ success: false, error: 'Payment not completed' }, { status: 400 })
    }

    if (session.metadata?.userId !== uid) {
      return NextResponse.json({ success: false, error: 'Session does not belong to user' }, { status: 403 })
    }

    await handleMarketplaceCheckoutCompleted(session)
    await markCheckoutSessionProcessed(sessionId)

    const pending = await findPendingOrderByStripeSession(sessionId)
    return NextResponse.json({
      success: true,
      orderId: pending?.id,
    })
  } catch (error) {
    console.error('[marketplace/confirm] error:', error)
    return NextResponse.json({ success: false, error: 'Confirmation failed' }, { status: 500 })
  }
}
