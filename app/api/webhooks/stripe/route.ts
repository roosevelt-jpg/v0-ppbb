import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe-utils'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import {
  constructStripeWebhookEvent,
  handleMarketplaceCheckoutCompleted,
  isCheckoutSessionProcessed,
  markCheckoutSessionProcessed,
} from '@/lib/stripe-webhook-marketplace'
import { recordReferralConversion } from '@/lib/referral-conversion-server'

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

    // Admin SDK throughout this handler, not the client SDK: Firestore
    // rules require an authenticated matching user for both `subscriptions`
    // and `users` writes, and this is a server-to-server webhook with no
    // Firebase Auth session at all. Every client-SDK write here used to be
    // an unauthenticated request that Firestore rules reject outright —
    // subscription tracking (and everything downstream of it, including
    // renewal dates) was failing silently on every single event.
    const db = getAdminDb()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          id: string
          mode?: string
          amount_total?: number | null
          metadata?: Record<string, string>
        }
        if (session.metadata?.type === 'marketplace') {
          if (await isCheckoutSessionProcessed(session.id)) {
            break
          }
          await handleMarketplaceCheckoutCompleted(event.data.object as never)
          await markCheckoutSessionProcessed(session.id)
        } else if (session.metadata?.type === 'event_ticket' && session.metadata.registrationId) {
          const {
            generateCheckInCode,
            generateQrToken,
            incrementTicketSold,
            incrementCouponUsed,
          } = await import('@/lib/event-luma-server')
          const regRef = db.collection('eventRegistrations').doc(session.metadata.registrationId)
          const regSnap = await regRef.get()
          if (regSnap.exists && regSnap.data()?.paymentStatus !== 'paid') {
            const reg = regSnap.data()!
            const amount =
              typeof session.amount_total === 'number'
                ? session.amount_total / 100
                : reg.amountPaid || 0
            await regRef.update({
              paymentStatus: 'paid',
              status: reg.status === 'pending' ? 'pending' : 'confirmed',
              paidAt: Timestamp.now(),
              paymentReference: session.id,
              checkInCode: reg.checkInCode || generateCheckInCode(),
              qrToken: reg.qrToken || generateQrToken(),
              amountPaid: amount,
            })
            if (reg.status !== 'pending') {
              await db.collection('events').doc(session.metadata.eventId).update({
                currentAttendees: FieldValue.increment(1),
                totalRevenue: FieldValue.increment(amount),
                pbRevenue: FieldValue.increment(reg.pbCut || 0),
                businessRevenue: FieldValue.increment(reg.businessCut || 0),
                updatedAt: Timestamp.now(),
              })
              if (session.metadata.ticketTypeId && session.metadata.ticketTypeId !== 'legacy') {
                await incrementTicketSold(session.metadata.eventId, session.metadata.ticketTypeId)
              }
              if (session.metadata.couponCode) {
                await incrementCouponUsed(session.metadata.eventId, session.metadata.couponCode)
              }
            }
            if (amount > 0 && session.metadata.userId) {
              void recordReferralConversion({
                convertedUserId: session.metadata.userId,
                conversionType: 'event',
                relatedDocId: session.metadata.registrationId,
                revenueAmount: amount,
                status: 'confirmed',
                idempotencyKey: `event-paid:${session.id}`,
              }).catch((err) => console.error('[referral] event paid:', err))
            }
            const email = (reg.userEmail as string) || ''
            if (email) {
              const eventSnap = await db.collection('events').doc(session.metadata.eventId).get()
              const title = (eventSnap.data()?.title as string) || 'Event'
              const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://test.myflynai.com'
              const updated = (await regRef.get()).data()
              const { sendEventRegistrationEmail } = await import('@/lib/event-confirmation-email')
              void sendEventRegistrationEmail({
                to: email,
                eventTitle: title,
                eventUrl: `${site}/events/${session.metadata.eventId}/confirmation?registrationId=${session.metadata.registrationId}`,
                status: String(updated?.status || 'confirmed'),
                checkInCode: (updated?.checkInCode as string) || null,
              })
            }
          }
        } else if (
          session.metadata?.type === 'advertising' &&
          session.metadata.advertisingRequestId
        ) {
          await db
            .collection('advertisingRequests')
            .doc(session.metadata.advertisingRequestId)
            .set(
              {
                status: 'paid',
                paidAt: Timestamp.now(),
                stripeSessionId: session.id,
                updatedAt: Timestamp.now(),
              },
              { merge: true }
            )
        }
        // Membership no longer goes through Checkout Sessions at all — an
        // embedded card form on our own page creates the Subscription
        // directly (see createStripeMembershipIntent), so activation is
        // handled below in customer.subscription.updated instead.
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer
        const subscriptionId = subscription.id

        // The embedded-checkout flow puts userId/planId directly on the
        // Subscription's own metadata at creation time (createStripeMembershipIntent).
        // Fall back to a customer-email lookup for anything else that ends
        // up here without it.
        let userId = subscription.metadata?.userId as string | undefined
        if (!userId) {
          const { stripe } = await import('@/lib/stripe-utils')
          const customer = await stripe.customers.retrieve(customerId)
          const email = (customer as any).email
          const usersSnap = await db.collection('users').where('email', '==', email).limit(1).get()
          userId = usersSnap.docs[0]?.id
        }

        if (!userId) {
          console.error('[v0] User not found for subscription:', subscriptionId)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const subRef = db.collection('subscriptions').doc(subscriptionId)
        const prevSnap = await subRef.get()
        const prevStatus = prevSnap.exists ? (prevSnap.data()?.status as string | undefined) : undefined

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

        await db.collection('subscriptions').doc(subscriptionId).set(subscriptionData, { merge: true })
        console.log('[v0] Subscription saved:', subscriptionId)

        const isActiveNow = ['active', 'trialing'].includes(subscription.status)
        const wasActiveBefore = ['active', 'trialing'].includes(prevStatus || '')

        if (
          subscription.metadata?.type === 'membership' &&
          subscription.metadata.planId &&
          isActiveNow &&
          !wasActiveBefore
        ) {
          // The subscription just transitioned into active/trialing for the
          // first time — the member confirmed their card on the embedded
          // form and Stripe accepted it. Fires here rather than at
          // subscription creation because `customer.subscription.created`
          // arrives immediately with status 'incomplete', before the
          // member has entered anything — activating there would grant
          // access before payment is actually confirmed.
          const { completeMembershipPayment } = await import('@/lib/payment-completion')
          await completeMembershipPayment({
            userId,
            planId: subscription.metadata.planId,
            gateway: 'stripe',
            paymentReference: subscriptionId,
            promoCodeId: subscription.metadata.promoCodeId || undefined,
            promoCode: subscription.metadata.promoCode || undefined,
            renewDateOverride: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined,
          })
        } else if (
          subscription.status === 'incomplete_expired' &&
          subscription.metadata?.promoCodeId &&
          prevStatus !== 'incomplete_expired'
        ) {
          // A trial-promo reservation whose member never finished entering
          // a card — Stripe auto-expires the subscription (default 23
          // hours). Roll the reservation back so the code isn't burned.
          const { rollbackMembershipPromoReservation } = await import('@/lib/membership-promo')
          await rollbackMembershipPromoReservation(
            subscription.metadata.promoCodeId,
            userId
          ).catch((err) => console.error('[v0] Promo rollback on subscription expiry failed:', err))
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const subscriptionId = subscription.id

        await db.collection('subscriptions').doc(subscriptionId).update({
          status: 'cancelled',
          cancelledAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })

        try {
          const {
            notifyMembershipCancelled,
            resolveUserIdForSubscription,
          } = await import('@/lib/member-notifications')
          const userId = await resolveUserIdForSubscription({
            subscriptionId,
            email: subscription.metadata?.email || null,
          })
          if (userId) {
            // The subscription is genuinely gone (cancelled, or Stripe gave
            // up retrying a failed card) — without this, hasActiveMembership
            // keeps returning true forever since it short-circuits on
            // status === 'active' before ever checking a renew date.
            await db.collection('users').doc(userId).set(
              { membershipStatus: 'cancelled', updatedAt: Timestamp.now() },
              { merge: true }
            )

            const endsAt = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null
            notifyMembershipCancelled({
              userId,
              planName: subscription.metadata?.planName || undefined,
              endsAt,
            })
          }
        } catch (mailErr) {
          console.error('[v0] Cancel handling failed:', mailErr)
        }

        console.log('[v0] Subscription cancelled:', subscriptionId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          const periodEndSec = invoice.lines?.data?.[0]?.period?.end
          const paidAtSec = invoice.status_transitions?.paid_at || invoice.created
          const chargeData = {
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscriptionId,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'succeeded',
            paidAt: Timestamp.fromDate(new Date((paidAtSec || Date.now() / 1000) * 1000)),
            nextBillingDate: periodEndSec
              ? Timestamp.fromDate(new Date(periodEndSec * 1000))
              : null,
            createdAt: Timestamp.now(),
          }

          await db
            .collection('subscriptions')
            .doc(subscriptionId)
            .collection('charges')
            .doc(invoice.id)
            .set(chargeData)

          if (periodEndSec) {
            await db.collection('subscriptions').doc(subscriptionId).update({
              nextBillingDate: Timestamp.fromDate(new Date(periodEndSec * 1000)),
              paymentStatus: 'succeeded',
              updatedAt: Timestamp.now(),
            })
          }

          const customerEmail =
            typeof invoice.customer_email === 'string' ? invoice.customer_email : null
          try {
            const { resolveUserIdForSubscription } = await import('@/lib/member-notifications')
            const userId = await resolveUserIdForSubscription({ subscriptionId, email: customerEmail })

            // Push the user doc's membershipRenewDate forward on every
            // successful charge — completeMembershipPayment only ever sets
            // it once, at checkout completion. Without this, membership-
            // expire would downgrade every paying Stripe subscriber (trial
            // or not) the moment their *first* billing period ends, even
            // though they're still actively paying every cycle.
            if (userId && periodEndSec) {
              await db.collection('users').doc(userId).set(
                {
                  membershipStatus: 'active',
                  membershipRenewDate: new Date(periodEndSec * 1000).toISOString(),
                  membershipExpiredAt: FieldValue.delete(),
                  updatedAt: Timestamp.now(),
                },
                { merge: true }
              )
            }

            // Renewal emails for recurring cycles (first payment already covered by checkout activation)
            const billingReason = String(invoice.billing_reason || '')
            if (userId && (billingReason === 'subscription_cycle' || billingReason === 'subscription_update')) {
              const { notifyMembershipRenewed } = await import('@/lib/member-notifications')
              notifyMembershipRenewed({
                userId,
                planName: invoice.lines?.data?.[0]?.description || undefined,
                amount: invoice.amount_paid / 100,
                currency: String(invoice.currency || 'aed').toUpperCase(),
                nextBillingDate: periodEndSec ? new Date(periodEndSec * 1000) : null,
              })
            }
          } catch (mailErr) {
            console.error('[v0] Renewal handling failed:', mailErr)
          }

          console.log('[v0] Charge logged for subscription:', subscriptionId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          const chargeData = {
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscriptionId,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: 'failed',
            failureReason: invoice.last_finalization_error?.message,
            createdAt: Timestamp.now(),
          }

          await db
            .collection('subscriptions')
            .doc(subscriptionId)
            .collection('charges')
            .doc(invoice.id)
            .set(chargeData)

          await db.collection('subscriptions').doc(subscriptionId).update({
            paymentStatus: 'failed',
            lastPaymentError: invoice.last_finalization_error?.message,
            updatedAt: Timestamp.now(),
          })

          try {
            const {
              notifyMembershipPaymentFailed,
              resolveUserIdForSubscription,
            } = await import('@/lib/member-notifications')
            const customerEmail =
              typeof invoice.customer_email === 'string' ? invoice.customer_email : null
            const userId = await resolveUserIdForSubscription({
              subscriptionId,
              email: customerEmail,
            })
            if (userId) {
              notifyMembershipPaymentFailed({
                userId,
                planName: invoice.lines?.data?.[0]?.description || undefined,
                amount: invoice.amount_due / 100,
                currency: String(invoice.currency || 'aed').toUpperCase(),
                reason: invoice.last_finalization_error?.message || invoice.billing_reason,
              })
            }
          } catch (mailErr) {
            console.error('[v0] Payment-failed email failed:', mailErr)
          }

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
