import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder, getPayPalSubscription } from '@/lib/paypal-client'
import {
  completeEventTicketPayment,
  completeMembershipPayment,
  consumeMembershipCheckoutSession,
  getPublicAppUrl,
} from '@/lib/payment-completion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PayPal return handler for:
 * - Membership subscriptions (?type=membership&planId=&userId=&subscription_id=)
 * - Event ticket orders (?type=event&eventId=&registrationId=&token=ORDER_ID)
 */
export async function GET(request: NextRequest) {
  const site = getPublicAppUrl()
  const sp = request.nextUrl.searchParams
  const type = sp.get('type') || 'membership'

  try {
    if (type === 'event') {
      const eventId = sp.get('eventId') || ''
      const registrationId = sp.get('registrationId') || ''
      const orderId = sp.get('token') || sp.get('orderId') || ''
      if (!eventId || !registrationId || !orderId) {
        return NextResponse.redirect(`${site}/events?error=paypal_missing_params`)
      }

      const captured = await capturePayPalOrder(orderId)
      if (String(captured.status).toUpperCase() !== 'COMPLETED') {
        return NextResponse.redirect(
          `${site}/events/${eventId}?error=paypal_payment_incomplete`
        )
      }

      const { confirmationUrl } = await completeEventTicketPayment({
        registrationId,
        eventId,
        paymentReference: orderId,
        gateway: 'paypal',
      })
      return NextResponse.redirect(confirmationUrl)
    }

    // Membership subscription return
    const subscriptionId = sp.get('subscription_id') || ''
    if (!subscriptionId) {
      return NextResponse.redirect(`${site}/dashboard/membership?status=error&reason=missing_params`)
    }

    const sub = await getPayPalSubscription(subscriptionId)
    const ok = ['ACTIVE', 'APPROVED'].includes(String(sub.status || '').toUpperCase())
    if (!ok) {
      return NextResponse.redirect(
        `${site}/dashboard/membership?status=error&reason=subscription_${sub.status || 'unknown'}`
      )
    }

    // Resolve the real userId/planId from the checkout session created
    // server-side at checkout time — never from this URL's query params,
    // which a visitor can freely rewrite while keeping their own genuinely
    // approved subscriptionId. This also makes the return idempotent: a
    // second visit to the same URL fails here instead of re-crediting.
    const { userId, planId } = await consumeMembershipCheckoutSession(
      'paypal',
      'subscriptionId',
      subscriptionId
    )

    const { membershipUrl } = await completeMembershipPayment({
      userId,
      planId,
      gateway: 'paypal',
      paymentReference: subscriptionId,
    })
    return NextResponse.redirect(membershipUrl)
  } catch (error) {
    console.error('[paypal/return]', error)
    if (type === 'event') {
      const eventId = sp.get('eventId')
      return NextResponse.redirect(
        eventId
          ? `${site}/events/${eventId}?error=paypal_return_failed`
          : `${site}/events?error=paypal_return_failed`
      )
    }
    return NextResponse.redirect(`${site}/dashboard/membership?status=error&reason=paypal_return`)
  }
}
