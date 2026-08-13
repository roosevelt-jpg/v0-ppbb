import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  HOSTING_BILLED_TO,
  HOSTING_LINE_ITEMS,
  HOSTING_TOTAL_USD,
} from '@/lib/hosting-config'
import { getHostingRecord } from '@/lib/hosting-server'
import {
  getStripeHostingClient,
  resolveStripeHostingConfig,
} from '@/lib/resolve-stripe-hosting'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Hosted Stripe Checkout for platform hosting.
 * Handles 3D Secure on Stripe's domain (more reliable than embedded Payment Element).
 */
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

    const origin = request.nextUrl.origin
    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      origin

    const stripe = await getStripeHostingClient()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      line_items: HOSTING_LINE_ITEMS.map((item) => ({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(item.amountUsd * 100),
          product_data: {
            name: item.label,
            description:
              'detail' in item && item.detail
                ? `${item.detail} · Invoice: ${HOSTING_BILLED_TO}`
                : `Invoice: ${HOSTING_BILLED_TO}`,
          },
        },
      })),
      success_url: `${appUrl}/admin/hosting?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/admin/hosting?canceled=1`,
      metadata: {
        purpose: 'platform_hosting',
        billedTo: HOSTING_BILLED_TO,
        adminUid: uid,
        amountUsd: String(HOSTING_TOTAL_USD),
      },
      payment_intent_data: {
        description: `Passive Blessings cloud hosting — $${HOSTING_TOTAL_USD}`,
        metadata: {
          purpose: 'platform_hosting',
          billedTo: HOSTING_BILLED_TO,
          adminUid: uid,
          amountUsd: String(HOSTING_TOTAL_USD),
        },
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Stripe did not return a checkout URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
        amountUsd: HOSTING_TOTAL_USD,
      },
    })
  } catch (error) {
    console.error('[api/admin/hosting/checkout]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start hosting checkout',
      },
      { status: 500 }
    )
  }
}
