import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { notifyMembershipActivated } from '@/lib/member-notifications'
import { getAdminDb } from '@/lib/firebase-admin'

/**
 * Send branded upgrade email after an admin changes a member's plan.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdminUser(uid))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const memberId = String(body.memberId || '').trim()
    const planName = String(body.planName || '').trim() || 'your new plan'
    const previousPlanName = String(body.previousPlanName || '').trim() || null
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'memberId required' }, { status: 400 })
    }

    const snap = await getAdminDb().collection('users').doc(memberId).get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }
    const data = snap.data() || {}
    const renewRaw = data.membershipRenewDate
    const renewDate =
      typeof renewRaw === 'string'
        ? new Date(renewRaw)
        : renewRaw && typeof renewRaw.toDate === 'function'
          ? renewRaw.toDate()
          : null

    notifyMembershipActivated({
      userId: memberId,
      planName: planName || String(data.membershipPlanName || 'membership'),
      previousPlanName,
      renewDate: renewDate && !Number.isNaN(renewDate.getTime()) ? renewDate : null,
      isUpgrade: true,
      isLifetime: data.membershipLifetimeForever === true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[email/membership-upgrade]', error)
    return NextResponse.json({ success: false, error: 'Failed to send upgrade email' }, { status: 500 })
  }
}
