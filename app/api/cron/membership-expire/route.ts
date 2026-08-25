import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { notifyMembershipExpired } from '@/lib/member-notifications'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }
  return null
}

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || ''
  const authHeader = request.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const headerSecret = request.headers.get('x-vercel-cron-secret') || ''
  if (!cronSecret) {
    // Allow scheduler requests without a shared secret only when CRON_SECRET is unset.
    return Boolean(request.headers.get('x-vercel-cron') === '1' || bearer || headerSecret)
  }
  return bearer === cronSecret || headerSecret === cronSecret
}

/**
 * Daily: downgrade any 'active' membership whose renewDate has passed.
 *
 * membershipStatus never flips on its own — completeMembershipPayment only
 * ever sets it to 'active' (real payment or promo grant alike) and nothing
 * else touches it afterward. hasActiveMembership() in lib/membership-access
 * returns true the moment it sees status === 'active', before it even looks
 * at membershipRenewDate, so a promo-granted "free for 3 months" membership
 * was actually free forever in practice — access never lapsed on its own.
 * This is what actually enforces the renew date: no auto-charge, just a
 * clean downgrade to 'expired' (excluded by hasActiveMembership) plus a
 * "subscribe again" email. lib/pricing-utils.ts's dashboard "current plan"
 * check was updated alongside this to also require active status, so the
 * Subscribe button re-enables the moment this runs.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const now = new Date()

    const snap = await db.collection('users').where('membershipStatus', '==', 'active').limit(500).get()

    let expired = 0
    let skipped = 0

    for (const doc of snap.docs) {
      const data = doc.data() || {}
      if (data.membershipLifetimeForever === true) {
        skipped++
        continue
      }

      const renewDate = toDate(data.membershipRenewDate)
      if (!renewDate || renewDate >= now) {
        skipped++
        continue
      }

      await doc.ref.set(
        {
          membershipStatus: 'expired',
          membershipExpiredAt: now.toISOString(),
        },
        { merge: true }
      )

      notifyMembershipExpired({
        userId: doc.id,
        planName: String(data.membershipPlanName || data.membershipTier || 'membership'),
      })

      expired++
    }

    return NextResponse.json({
      success: true,
      scanned: snap.size,
      expired,
      skipped,
    })
  } catch (error) {
    console.error('[cron/membership-expire]', error)
    return NextResponse.json({ error: 'Failed to process expirations' }, { status: 500 })
  }
}
