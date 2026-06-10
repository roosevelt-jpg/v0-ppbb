import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { amount, campaignId, donorId, isAnonymous } = await req.json()

    if (!amount || !campaignId || !donorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const paymentIntent = await createPaymentIntent(amount, 'aed', {
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
