import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminDb } from '@/lib/firebase-admin'
import { HOSTING_BILLED_TO, HOSTING_TOTAL_USD } from '@/lib/hosting-config'
import { getHostingRecord } from '@/lib/hosting-server'
import {
  getStripeHostingClient,
  resolveStripeHostingConfig,
} from '@/lib/resolve-stripe-hosting'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(HOSTING_TOTAL_USD * 100),
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

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey: config.publishableKey,
        amountUsd: HOSTING_TOTAL_USD,
        currency: 'usd',
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
