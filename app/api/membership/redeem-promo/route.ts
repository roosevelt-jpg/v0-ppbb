import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { redeemMembershipPromo } from '@/lib/membership-promo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }
    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const code = String(body.code || '').trim()
    if (!code) {
      return NextResponse.json({ success: false, error: 'Promo code is required' }, { status: 400 })
    }

    const result = await redeemMembershipPromo({ userId: uid, code })
    return NextResponse.json({
      success: true,
      data: {
        planId: result.planId,
        planName: result.planName,
        renewDate: result.renewDate,
        membershipUrl: result.membershipUrl,
        // Set instead of membershipUrl for a trial-enabled code — the
        // caller must render the embedded Stripe card form with this
        // client secret before anything activates.
        clientSecret: result.clientSecret,
        intentMode: result.intentMode,
        code: result.promo.code,
        benefitDurationMonths: result.promo.benefitDurationMonths,
        trialEnabled: result.promo.trialEnabled,
      },
    })
  } catch (error) {
    console.error('[api/membership/redeem-promo]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redeem promo code',
      },
      { status: 400 }
    )
  }
}
