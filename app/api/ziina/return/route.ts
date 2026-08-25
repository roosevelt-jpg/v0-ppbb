import { NextRequest, NextResponse } from 'next/server'
import { getZiinaPaymentIntent } from '@/lib/ziina-client'
import {
  completeEventTicketPayment,
  completeMembershipPayment,
  consumeMembershipCheckoutSession,
  getPublicAppUrl,
} from '@/lib/payment-completion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Ziina success return handler.
 * Query: type=membership|event, planId/userId or eventId/registrationId, payment_intent_id or {PAYMENT_INTENT_ID}
 */
export async function GET(request: NextRequest) {
  const site = getPublicAppUrl()
  const sp = request.nextUrl.searchParams
  const type = sp.get('type') || 'membership'
  const paymentIntentId =
    sp.get('payment_intent_id') ||
    sp.get('PAYMENT_INTENT_ID') ||
    sp.get('id') ||
    ''

  try {
    if (!paymentIntentId) {
      const dest =
        type === 'event'
          ? `${site}/events?error=ziina_missing_intent`
          : `${site}/dashboard/membership?status=error&reason=missing_intent`
      return NextResponse.redirect(dest)
    }

    const intent = await getZiinaPaymentIntent(paymentIntentId)
    if (intent.status !== 'completed') {
      const dest =
        type === 'event'
          ? `${site}/events/${sp.get('eventId') || ''}?error=ziina_${intent.status}`
          : `${site}/dashboard/membership?status=error&reason=ziina_${intent.status}`
      return NextResponse.redirect(dest)
    }

    if (type === 'event') {
      const eventId = sp.get('eventId') || ''
      const registrationId = sp.get('registrationId') || ''
      if (!eventId || !registrationId) {
        return NextResponse.redirect(`${site}/events?error=ziina_missing_params`)
      }
      const amountMajor =
        typeof intent.amount === 'number' ? intent.amount / 100 : undefined
      const { confirmationUrl } = await completeEventTicketPayment({
        registrationId,
        eventId,
        paymentReference: paymentIntentId,
        gateway: 'ziina',
        amountMajor,
      })
      return NextResponse.redirect(confirmationUrl)
    }

    // Resolve the real userId/planId from the checkout session created
    // server-side at checkout time — never from this URL's query params,
    // which a visitor can freely rewrite while keeping their own genuinely
    // completed paymentIntentId. This also makes the return idempotent: a
    // second visit to the same URL fails here instead of re-crediting.
    const { userId, planId } = await consumeMembershipCheckoutSession(
      'ziina',
      'transactionId',
      paymentIntentId
    )

    const { membershipUrl } = await completeMembershipPayment({
      userId,
      planId,
      gateway: 'ziina',
      paymentReference: paymentIntentId,
      amountCents: typeof intent.amount === 'number' ? intent.amount : undefined,
      currency: intent.currency_code,
    })
    return NextResponse.redirect(membershipUrl)
  } catch (error) {
    console.error('[ziina/return]', error)
    if (type === 'event') {
      return NextResponse.redirect(
        `${site}/events/${sp.get('eventId') || ''}?error=ziina_return_failed`
      )
    }
    return NextResponse.redirect(`${site}/dashboard/membership?status=error&reason=ziina_return`)
  }
}
