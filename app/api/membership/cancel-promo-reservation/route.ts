import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getAdminDb } from '@/lib/firebase-admin'
import { rollbackMembershipPromoReservation } from '@/lib/membership-promo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Release an incomplete promo reservation (user abandoned Stripe card form).
 * Restores usedCount and clears membershipPromoCodeId so they can try again.
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

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data() || {}
    const promoId = String(userData.membershipPromoCodeId || '').trim()

    if (!promoId) {
      return NextResponse.json({ success: true, released: false, message: 'No promo reservation' })
    }

    // Never undo a completed membership (free grant, Stripe trial, or percent-off).
    // Only release when the card step was abandoned before activation.
    const expiresRaw = userData.membershipExpiresAt
    const expiresAt = expiresRaw
      ? new Date(
          typeof expiresRaw?.toDate === 'function' ? expiresRaw.toDate() : expiresRaw
        )
      : null
    const active =
      userData.membershipStatus === 'active' ||
      userData.membershipStatus === 'trialing' ||
      userData.membershipActive === true ||
      Boolean(expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt > new Date())

    if (active) {
      return NextResponse.json({
        success: true,
        released: false,
        message: 'Membership already active — promo kept',
      })
    }

    await rollbackMembershipPromoReservation(promoId, uid)

    return NextResponse.json({ success: true, released: true })
  } catch (error) {
    console.error('[membership/cancel-promo-reservation]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to release promo reservation' },
      { status: 500 }
    )
  }
}
