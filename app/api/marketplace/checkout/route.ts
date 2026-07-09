import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getStripeClient } from '@/lib/get-stripe-client'
import {
  createPendingMarketplaceOrder,
  loadMarketplaceOffer,
} from '@/lib/marketplace-purchase-server'

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
    if (!offerId) {
      return NextResponse.json({ success: false, error: 'offerId required' }, { status: 400 })
    }

    const offerRow = await loadMarketplaceOffer(offerId)
    if (!offerRow) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
    }

    const offer = offerRow.data
    const amount = typeof offer.price === 'number' ? offer.price : 0
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'This listing has no price — use enquire instead.' },
        { status: 400 }
      )
    }

    const currency = String(offer.currency || 'AED').toLowerCase()
    const title = String(offer.title || 'Marketplace listing')
    const businessId = String(offer.businessId || '')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    const stripe = await getStripeClient()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: title,
              metadata: { offerId, businessId },
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/marketplace/${offerId}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/marketplace/${offerId}?status=canceled`,
      metadata: {
        type: 'marketplace',
        offerId,
        userId: uid,
        businessId,
      },
    })

    if (!session.url) {
      return NextResponse.json({ success: false, error: 'Failed to create checkout session' }, { status: 500 })
    }

    const orderId = await createPendingMarketplaceOrder({
      offerId,
      buyerId: uid,
      stripeSessionId: session.id,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      orderId,
    })
  } catch (error) {
    console.error('[marketplace/checkout] error:', error)
    const message = error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
