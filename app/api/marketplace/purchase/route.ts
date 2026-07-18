import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import {
  completeMarketplacePurchase,
  loadMarketplaceOffer,
} from '@/lib/marketplace-purchase-server'
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

    const body = await request.json()
    const offerId = String(body.offerId || '')
    const mode = body.mode === 'enquire' ? 'enquire' : 'purchase'
    const paymentMethod = (body.paymentMethod || 'card') as MarketplacePaymentMethod

    if (!offerId) {
      return NextResponse.json({ success: false, error: 'offerId required' }, { status: 400 })
    }

    const offerRow = await loadMarketplaceOffer(offerId)
    if (!offerRow) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
    }

    const amount = typeof offerRow.data.price === 'number' ? offerRow.data.price : 0

    if (mode === 'purchase' && amount > 0) {
      if (paymentMethod === 'card' && body.paymentGateway !== 'stripe' && !body.paymentReference) {
        return NextResponse.json(
          {
            success: false,
            error: 'Card payments require Stripe checkout',
            requiresCheckout: true,
          },
          { status: 402 }
        )
      }

      const invoiceAddress = body.invoiceAddress as MarketplaceAddress | undefined
      const deliveryAddress = (body.deliveryAddress || body.invoiceAddress) as
        | MarketplaceAddress
        | undefined
      if (invoiceAddress) {
        const invErr = validateMarketplaceAddress(invoiceAddress, 'Invoice address')
        if (invErr) return NextResponse.json({ success: false, error: invErr }, { status: 400 })
      }
      if (deliveryAddress) {
        const delErr = validateMarketplaceAddress(deliveryAddress, 'Delivery address')
        if (delErr) return NextResponse.json({ success: false, error: delErr }, { status: 400 })
      }

      const result = await completeMarketplacePurchase({
        offerId,
        buyerId: uid,
        mode,
        paymentReference: body.paymentReference,
        paymentGateway: body.paymentGateway || paymentMethod,
        paymentMethod,
        invoiceAddress,
        deliveryAddress,
        awaitingFulfillment: paymentMethod === 'cod' || paymentMethod === 'bank_transfer',
      })

      return NextResponse.json({ success: true, ...result })
    }

    const result = await completeMarketplacePurchase({
      offerId,
      buyerId: uid,
      mode,
      paymentReference: body.paymentReference,
      paymentGateway: body.paymentGateway || (amount > 0 ? 'stripe' : 'direct'),
      paymentMethod: amount > 0 ? paymentMethod : undefined,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[marketplace/purchase] error:', error)
    return NextResponse.json({ success: false, error: 'Purchase failed' }, { status: 500 })
  }
}
