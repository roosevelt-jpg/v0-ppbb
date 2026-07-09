import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import {
  completeMarketplacePurchase,
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
    const mode = body.mode === 'enquire' ? 'enquire' : 'purchase'

    if (!offerId) {
      return NextResponse.json({ success: false, error: 'offerId required' }, { status: 400 })
    }

    const offerRow = await loadMarketplaceOffer(offerId)
    if (!offerRow) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
    }

    const amount = typeof offerRow.data.price === 'number' ? offerRow.data.price : 0

    if (mode === 'purchase' && amount > 0 && body.paymentGateway !== 'stripe' && !body.paymentReference) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paid listings require Stripe checkout',
          requiresCheckout: true,
        },
        { status: 402 }
      )
    }

    const result = await completeMarketplacePurchase({
      offerId,
      buyerId: uid,
      mode,
      paymentReference: body.paymentReference,
      paymentGateway: body.paymentGateway || (amount > 0 ? 'stripe' : 'direct'),
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[marketplace/purchase] error:', error)
    return NextResponse.json({ success: false, error: 'Purchase failed' }, { status: 500 })
  }
}
