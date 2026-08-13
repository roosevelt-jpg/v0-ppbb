import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminDb } from '@/lib/firebase-admin'
import { HOSTING_TOTAL_USD } from '@/lib/hosting-config'
import { getHostingRecord, markHostingActive } from '@/lib/hosting-server'
import { getStripeHostingClient } from '@/lib/resolve-stripe-hosting'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Confirms a succeeded hosting PaymentIntent and marks Hosting Active.
 */
export async function POST(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const paymentIntentId = String(body.paymentIntentId || '').trim()
    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'paymentIntentId is required' },
        { status: 400 }
      )
    }

    const existing = await getHostingRecord()
    if (existing.status === 'active') {
      return NextResponse.json({ success: true, data: existing })
    }

    const stripe = await getStripeHostingClient()
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (
      pi.status === 'requires_payment_method' ||
      pi.status === 'requires_confirmation' ||
      pi.status === 'canceled'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment was not completed (status: ${pi.status}). Check name and card, then try again.`,
        },
        { status: 400 }
      )
    }

    if (pi.status === 'requires_action') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payment still needs bank authentication (3D Secure). Complete the challenge, then return here.',
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

    if (pi.metadata?.purpose !== 'platform_hosting') {
      return NextResponse.json(
        { success: false, error: 'Payment is not a hosting payment' },
        { status: 400 }
      )
    }

    const expectedCents = Math.round(HOSTING_TOTAL_USD * 100)
    if (pi.amount_received < expectedCents && pi.amount < expectedCents) {
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
      paymentIntentId,
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
