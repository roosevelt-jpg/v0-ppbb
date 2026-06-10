import { NextRequest, NextResponse } from 'next/server'
import { verifyStripeWebhook, recordDonation } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') || ''

  const event = await verifyStripeWebhook(body, signature)

  if (!event) {
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any
        const { donorId, campaignId, amount, isAnonymous } = paymentIntent.metadata

        if (donorId && campaignId) {
          await recordDonation(donorId, campaignId, parseInt(amount), paymentIntent.id, isAnonymous === 'true')
        }
        break
      }

      case 'payment_intent.payment_failed': {
        console.log('[v0] Payment failed:', event.data.object)
        // Handle failed payment
        break
      }

      default:
        console.log(`[v0] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[v0] Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
