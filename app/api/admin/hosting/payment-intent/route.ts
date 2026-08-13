import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminDb } from '@/lib/firebase-admin'
import { HOSTING_BILLED_TO, HOSTING_TOTAL_USD } from '@/lib/hosting-config'
import {
  getHostingRecord,
  setPendingHostingPaymentIntent,
} from '@/lib/hosting-server'
import {
  getStripeHostingClient,
  resolveStripeHostingConfig,
} from '@/lib/resolve-stripe-hosting'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REUSABLE_STATUSES = new Set([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
])

export async function POST(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const config = await resolveStripeHostingConfig()
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Hosting Stripe is not configured. Add credentials under Admin → Integrations → Stripe (Hosting).',
        },
        { status: 503 }
      )
    }

    // Publishable + secret must be same mode (test/live) or Payment Element stays Incomplete
    const pkTest = config.publishableKey.startsWith('pk_test_')
    const skTest = config.secretKey.startsWith('sk_test_')
    const pkLive = config.publishableKey.startsWith('pk_live_')
    const skLive = config.secretKey.startsWith('sk_live_')
    if ((pkTest && !skTest) || (pkLive && !skLive) || (!pkTest && !pkLive) || (!skTest && !skLive)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Stripe (Hosting) publishable and secret keys do not match (test vs live). Update both keys in Integrations.',
        },
        { status: 503 }
      )
    }

    const hosting = await getHostingRecord()
    if (hosting.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Hosting is already active.' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data() || {}
    const email =
      (typeof userData.email === 'string' && userData.email) ||
      (typeof userData.adminEmail === 'string' && userData.adminEmail) ||
      undefined

    const stripe = await getStripeHostingClient()
    const expectedAmount = Math.round(HOSTING_TOTAL_USD * 100)

    // Reuse an open PaymentIntent so refreshes don't flood Stripe with Incomplete intents
    const pendingId = hosting.pendingPaymentIntentId
    if (pendingId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(pendingId)
        if (
          REUSABLE_STATUSES.has(existing.status) &&
          existing.amount === expectedAmount &&
          existing.currency === 'usd' &&
          existing.metadata?.purpose === 'platform_hosting'
        ) {
          return NextResponse.json({
            success: true,
            data: {
              clientSecret: existing.client_secret,
              paymentIntentId: existing.id,
              publishableKey: config.publishableKey,
              amountUsd: HOSTING_TOTAL_USD,
              currency: 'usd',
              reused: true,
            },
          })
        }
        // Stale / wrong amount / already succeeded elsewhere — cancel if still open
        if (REUSABLE_STATUSES.has(existing.status)) {
          await stripe.paymentIntents.cancel(existing.id).catch(() => undefined)
        }
      } catch {
        /* create a fresh intent below */
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: expectedAmount,
      currency: 'usd',
      payment_method_types: ['card'],
      description: `Passive Blessings cloud hosting — $${HOSTING_TOTAL_USD}`,
      receipt_email: email,
      metadata: {
        purpose: 'platform_hosting',
        billedTo: HOSTING_BILLED_TO,
        adminUid: uid,
        amountUsd: String(HOSTING_TOTAL_USD),
      },
    })

    await setPendingHostingPaymentIntent(paymentIntent.id)

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey: config.publishableKey,
        amountUsd: HOSTING_TOTAL_USD,
        currency: 'usd',
        reused: false,
      },
    })
  } catch (error) {
    console.error('[api/admin/hosting/payment-intent]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start hosting payment',
      },
      { status: 500 }
    )
  }
}
