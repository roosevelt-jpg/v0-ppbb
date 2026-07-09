import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { persistUserReferralAttribution } from '@/lib/referral-attribution-server'
import { getReferralCodeFromRequest } from '@/lib/referral-cookie'

/**
 * Persist first-touch referral attribution on the signed-in user.
 * Accepts ?code= or body.referralCode, else reads pb_referral_code cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    let referralCode = getReferralCodeFromRequest(request)
    if (!referralCode) {
      try {
        const body = (await request.json()) as { referralCode?: string }
        referralCode = String(body.referralCode || '').trim() || null
      } catch {
        /* no body */
      }
    }

    if (!referralCode) {
      return NextResponse.json({ success: true, saved: false, reason: 'no_code' })
    }

    const result = await persistUserReferralAttribution(uid, referralCode)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[referral/attribute]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
