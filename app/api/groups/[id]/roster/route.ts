import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { toPublicMemberProfile } from '@/lib/user-settings'
import { assertCanUseGroup } from '@/lib/group-access-server'

/**
 * List active group members with privacy-aware profiles.
 * GET /api/groups/[id]/roster?communityId=
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const communityId = request.nextUrl.searchParams.get('communityId')
    if (!communityId) {
      return NextResponse.json({ success: false, error: 'communityId required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const access = await assertCanUseGroup(communityId, groupId, uid)
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status })
    }

    const db = getAdminDb()
    const groupRef = db.collection('communities').doc(communityId).collection('groups').doc(groupId)

    const membersSnap = await groupRef.collection('members').get()
    const roster = []

    for (const docSnap of membersSnap.docs) {
      const m = docSnap.data()
      const status = String(m.memberStatus || 'active')
      const active =
        (m.joinStatus === 'active' || (!m.joinStatus && m.isActive !== false)) &&
        status !== 'banned' &&
        status !== 'removed'
      if (!active) continue

      const userId = String(m.userId || '')
      if (!userId) continue
      const userSnap = await db.collection('users').doc(userId).get()
      const profile = toPublicMemberProfile(userId, userSnap.data(), uid)
      roster.push({
        memberDocId: docSnap.id,
        userId,
        role: m.role || 'member',
        joinedAt: m.joinedAt?.toDate?.()?.toISOString?.() || m.joinedAt || null,
        profile,
      })
    }

    roster.sort((a, b) => a.profile.displayName.localeCompare(b.profile.displayName))

    return NextResponse.json({ success: true, data: roster })
  } catch (error) {
    console.error('[v0] group roster error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load members' }, { status: 500 })
  }
}
