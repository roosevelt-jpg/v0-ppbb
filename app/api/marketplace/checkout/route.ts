import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getStripeClient } from '@/lib/get-stripe-client'
import {
  createPendingMarketplaceOrder,
  loadMarketplaceOffer,
} from '@/lib/marketplace-purchase-server'
import { persistUserReferralAttribution } from '@/lib/referral-attribution-server'
import { getReferralCodeFromRequest } from '@/lib/referral-cookie'
import {
  validateMarketplaceAddress,
  type MarketplaceAddress,
  type MarketplacePaymentMethod,
} from '@/lib/marketplace-shipping'

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

    const referralCode = getReferralCodeFromRequest(request)
    if (referralCode) {
      void persistUserReferralAttribution(uid, referralCode).catch(console.error)
    }

    const body = await request.json()
    const offerId = String(body.offerId || '')
    if (!offerId) {
      return NextResponse.json({ success: false, error: 'offerId required' }, { status: 400 })
    }

    const paymentMethod = (body.paymentMethod || 'card') as MarketplacePaymentMethod
    if (!['card', 'cod', 'bank_transfer'].includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 })
    }

    const invoiceAddress = body.invoiceAddress as MarketplaceAddress
    const deliveryAddress = (body.deliveryAddress || body.invoiceAddress) as MarketplaceAddress
    const invErr = validateMarketplaceAddress(invoiceAddress, 'Invoice address')
    if (invErr) return NextResponse.json({ success: false, error: invErr }, { status: 400 })
    const delErr = validateMarketplaceAddress(deliveryAddress, 'Delivery address')
    if (delErr) return NextResponse.json({ success: false, error: delErr }, { status: 400 })

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

    // COD / bank transfer — no Stripe; complete order immediately as awaiting fulfillment
    if (paymentMethod === 'cod' || paymentMethod === 'bank_transfer') {
      const { completeMarketplacePurchase } = await import('@/lib/marketplace-purchase-server')
      const result = await completeMarketplacePurchase({
        offerId,
        buyerId: uid,
        mode: 'purchase',
        paymentMethod,
        paymentGateway: paymentMethod,
        paymentReference: `${paymentMethod}_${Date.now()}`,
        invoiceAddress,
        deliveryAddress,
        awaitingFulfillment: true,
      })
      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        invoiceUrl: result.invoiceUrl,
        receiptUrl: result.receiptUrl,
        paymentMethod,
        bankTransferDetails: result.bankTransferDetails || null,
      })
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
        paymentMethod: 'card',
      },
    })

    if (!session.url) {
      return NextResponse.json({ success: false, error: 'Failed to create checkout session' }, { status: 500 })
    }

    const orderId = await createPendingMarketplaceOrder({
      offerId,
      buyerId: uid,
      stripeSessionId: session.id,
      invoiceAddress,
      deliveryAddress,
      paymentMethod: 'card',
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      orderId,
      paymentMethod: 'card',
    })
  } catch (error) {
    console.error('[marketplace/checkout] error:', error)
    const message = error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
