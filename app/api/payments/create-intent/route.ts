import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load stripe to avoid build issues
async function getStripeModule() {
  try {
    return await import('@/lib/stripe')
  } catch (error) {
    console.error('[v0] Stripe module load error:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  const stripe = await getStripeModule()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not available' }, { status: 503 })
  }

  try {
    const { amount, campaignId, donorId, isAnonymous } = await req.json()

    if (!amount || !campaignId || !donorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const paymentIntent = await stripe.createPaymentIntent(amount, 'aed', {
      campaignId,
      donorId,
      isAnonymous: String(isAnonymous),
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('[v0] Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
