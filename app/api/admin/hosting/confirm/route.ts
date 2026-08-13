import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminDb } from '@/lib/firebase-admin'
import { HOSTING_TOTAL_USD } from '@/lib/hosting-config'
import { getHostingRecord, markHostingActive } from '@/lib/hosting-server'
import { getStripeHostingClient } from '@/lib/resolve-stripe-hosting'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const paymentIntentId = String(body.paymentIntentId || '').trim()
    const sessionId = String(body.sessionId || '').trim()

    if (!paymentIntentId && !sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId or paymentIntentId is required' },
        { status: 400 }
      )
    }

    const existing = await getHostingRecord()
    if (existing.status === 'active') {
      return NextResponse.json({ success: true, data: existing })
    }

    const stripe = await getStripeHostingClient()
    let resolvedPaymentIntentId = paymentIntentId
    let amountOk = false
    let purposeOk = false

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      })

      if (session.metadata?.purpose !== 'platform_hosting') {
        return NextResponse.json(
          { success: false, error: 'Checkout session is not a hosting payment' },
          { status: 400 }
        )
      }

      if (session.payment_status !== 'paid' && session.status !== 'complete') {
        return NextResponse.json(
          {
            success: false,
            error: `Payment was not completed (status: ${session.payment_status || session.status}). Try Pay again.`,
          },
          { status: 400 }
        )
      }

      const pi =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || ''
      if (!pi) {
        return NextResponse.json(
          { success: false, error: 'Checkout session has no payment intent yet' },
          { status: 400 }
        )
      }

      resolvedPaymentIntentId = pi
      purposeOk = true
      const expectedCents = Math.round(HOSTING_TOTAL_USD * 100)
      amountOk =
        typeof session.amount_total === 'number' ? session.amount_total >= expectedCents : true
    } else {
      const pi = await stripe.paymentIntents.retrieve(resolvedPaymentIntentId)

      if (
        pi.status === 'requires_payment_method' ||
        pi.status === 'requires_confirmation' ||
        pi.status === 'canceled'
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Payment was not completed in Stripe (status: ${pi.status}). Enter card details and click Pay again.`,
          },
          { status: 400 }
        )
      }

      if (pi.status === 'requires_action') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Payment still needs authentication (3D Secure). Complete the bank/card challenge, then return here.',
          },
          { status: 400 }
        )
      }

      if (pi.status !== 'succeeded' && pi.status !== 'processing') {
        return NextResponse.json(
          { success: false, error: `Payment not completed (status: ${pi.status})` },
          { status: 400 }
        )
      }

      purposeOk = pi.metadata?.purpose === 'platform_hosting'
      const expectedCents = Math.round(HOSTING_TOTAL_USD * 100)
      amountOk = pi.amount_received >= expectedCents || pi.amount >= expectedCents
    }

    if (!purposeOk) {
      return NextResponse.json(
        { success: false, error: 'Payment is not a hosting payment' },
        { status: 400 }
      )
    }

    if (!amountOk) {
      return NextResponse.json(
        { success: false, error: 'Paid amount does not match hosting total' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data() || {}
    const email =
      (typeof userData.email === 'string' && userData.email) ||
      (typeof userData.adminEmail === 'string' && userData.adminEmail) ||
      null

    const hosting = await markHostingActive({
      paymentIntentId: resolvedPaymentIntentId,
      adminUid: uid,
      adminEmail: email,
    })

    return NextResponse.json({ success: true, data: hosting })
  } catch (error) {
    console.error('[api/admin/hosting/confirm]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm hosting payment',
      },
      { status: 500 }
    )
  }
}
