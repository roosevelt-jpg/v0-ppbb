import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe-utils'
import { db } from '@/lib/firebase'
import { doc, setDoc, updateDoc, Timestamp, query, collection, where, getDocs } from 'firebase/firestore'
import {
  constructStripeWebhookEvent,
  handleMarketplaceCheckoutCompleted,
  isCheckoutSessionProcessed,
  markCheckoutSessionProcessed,
} from '@/lib/stripe-webhook-marketplace'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.arrayBuffer()
    const signature = req.headers.get('stripe-signature') || ''

    let event
    try {
      event = await constructStripeWebhookEvent(Buffer.from(body), signature)
    } catch {
      try {
        event = constructWebhookEvent(Buffer.from(body), signature)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid signature'
        console.error('[v0] Webhook signature verification failed:', message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    console.log('[v0] Processing webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          id: string
          metadata?: Record<string, string>
        }
        if (session.metadata?.type === 'marketplace') {
          if (await isCheckoutSessionProcessed(session.id)) {
            break
          }
          await handleMarketplaceCheckoutCompleted(event.data.object as never)
          await markCheckoutSessionProcessed(session.id)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer
        const subscriptionId = subscription.id

        // Get customer email
        const { stripe } = await import('@/lib/stripe-utils')
        const customer = await stripe.customers.retrieve(customerId)
        const email = (customer as any).email

        // Get user ID from Firestore by email
        const usersQuery = query(collection(db, 'users'), where('email', '==', email))
        const usersSnapshot = await getDocs(usersQuery)
        const userId = usersSnapshot.docs[0]?.id

        if (!userId) {
          console.error('[v0] User not found for email:', email)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Save subscription to Firestore
        const subscriptionData = {
          userId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          amount: subscription.items.data[0]?.price.unit_amount / 100,
          currency: subscription.items.data[0]?.price.currency,
          interval: subscription.items.data[0]?.price.recurring?.interval,
          status: subscription.status,
          currentPeriodStart: Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
          currentPeriodEnd: Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
          nextBillingDate: Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
          metadata: subscription.metadata,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }

        await setDoc(doc(db, 'subscriptions', subscriptionId), subscriptionData)
        console.log('[v0] Subscription saved:', subscriptionId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const subscriptionId = subscription.id

        // Mark subscription as cancelled
        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
          status: 'cancelled',
          cancelledAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })

        console.log('[v0] Subscription cancelled:', subscriptionId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          // Log charge
          const chargeData = {
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscriptionId,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'succeeded',
            paidAt: Timestamp.fromDate(new Date(invoice.paid_date * 1000)),
            nextBillingDate: Timestamp.fromDate(new Date(invoice.lines.data[0]?.period.end * 1000)),
            createdAt: Timestamp.now(),
          }

          await setDoc(doc(db, 'subscriptions', subscriptionId, 'charges', invoice.id), chargeData)

          // Update subscription next billing date
          await updateDoc(doc(db, 'subscriptions', subscriptionId), {
            nextBillingDate: Timestamp.fromDate(new Date(invoice.lines.data[0]?.period.end * 1000)),
            updatedAt: Timestamp.now(),
          })

          console.log('[v0] Charge logged for subscription:', subscriptionId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          // Log failed charge
          const chargeData = {
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscriptionId,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: 'failed',
            failureReason: invoice.last_finalization_error?.message,
            createdAt: Timestamp.now(),
          }

          await setDoc(doc(db, 'subscriptions', subscriptionId, 'charges', invoice.id), chargeData)

          // Update subscription status
          await updateDoc(doc(db, 'subscriptions', subscriptionId), {
            paymentStatus: 'failed',
            lastPaymentError: invoice.last_finalization_error?.message,
            updatedAt: Timestamp.now(),
          })

          console.log('[v0] Payment failed for subscription:', subscriptionId)
        }
        break
      }

      default:
        console.log('[v0] Unhandled webhook event type:', event.type)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
