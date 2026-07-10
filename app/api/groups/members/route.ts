import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'
import { verifyIdToken } from '@/lib/admin-access-server'
import { hasAdminAccessServer } from '@/lib/roles-server'
import { shouldNotifyUser, mapNotificationTypeToPreference } from '@/lib/user-settings'

async function notifyUser(
  userId: string,
  type: string,
  title: string,
  message: string
) {
  if (!userId) return
  try {
    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(userId).get()
    const userData = userSnap.data() || {}
    const pref = mapNotificationTypeToPreference(type)
    if (!shouldNotifyUser({ ...userData, id: userId }, 'in_app', pref)) return

    await db.collection('users').doc(userId).collection('notifications').add({
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
    })
  } catch (error) {
    console.warn('[v0] Could not notify user:', error)
  }
}

async function resolveActingUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyIdToken(token)
}

export async function GET(request: NextRequest) {
  try {
    const communityId = request.nextUrl.searchParams.get('communityId')
    const groupId = request.nextUrl.searchParams.get('groupId')
    const joinStatus = request.nextUrl.searchParams.get('joinStatus') || 'pending'

    if (!communityId || !groupId) {
      return NextResponse.json(
        { success: false, error: 'communityId and groupId required' },
        { status: 400 }
      )
    }

    const uid = await resolveActingUid(request)
    // Legacy fallback: requesterId query param (must match token when both present)
    const requesterIdParam = request.nextUrl.searchParams.get('requesterId')
    const requesterId = uid || requesterIdParam

    if (!requesterId) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      )
    }

    // If Bearer present, never trust a mismatched requesterId
    if (uid && requesterIdParam && requesterIdParam !== uid) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const db = getAdminDb()
    const groupRef = db.collection('communities').doc(communityId).collection('groups').doc(groupId)
    const groupSnap = await groupRef.get()
    if (!groupSnap.exists) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    const groupData = groupSnap.data()!
    const userSnap = await db.collection('users').doc(requesterId).get()
    const admin = hasAdminAccessServer(userSnap.data() || {})
    const isOwner = groupData.createdBy === requesterId
    if (!admin && !isOwner) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const query = groupRef.collection('members').where('joinStatus', '==', joinStatus)
    const snapshot = await query.get()
    const members = snapshot.docs.map((doc) =>
      serializeFirestoreDoc(doc.id, doc.data() as Record<string, unknown>)
    )

    return NextResponse.json({
      success: true,
      data: members,
      group: serializeFirestoreDoc(groupSnap.id, groupData as Record<string, unknown>),
    })
  } catch (error) {
    console.error('[v0] Error fetching group members:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { communityId, groupId, memberDocId, joinStatus } = body

    if (!communityId || !groupId || !memberDocId || !joinStatus) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (!['active', 'rejected'].includes(joinStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid joinStatus' }, { status: 400 })
    }

    const uid = await resolveActingUid(request)
    // Prefer verified token; fall back to body.approvedBy only if no token (legacy clients)
    const approvedBy: string | null = uid || (typeof body.approvedBy === 'string' ? body.approvedBy : null)

    if (!approvedBy) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      )
    }

    if (uid && body.approvedBy && body.approvedBy !== uid) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const db = getAdminDb()
    const groupRef = db.collection('communities').doc(communityId).collection('groups').doc(groupId)
    const groupSnap = await groupRef.get()

    if (!groupSnap.exists) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    const groupData = groupSnap.data()!
    const userSnap = await db.collection('users').doc(approvedBy).get()
    const admin = hasAdminAccessServer(userSnap.data() || {})
    const isOwner = groupData.createdBy === approvedBy

    if (!admin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only the group owner or an admin can approve members' },
        { status: 403 }
      )
    }

    const memberRef = groupRef.collection('members').doc(memberDocId)
    const memberSnap = await memberRef.get()
    if (!memberSnap.exists) {
      return NextResponse.json({ success: false, error: 'Member request not found' }, { status: 404 })
    }

    const memberData = memberSnap.data()!
    const wasPending = memberData.joinStatus === 'pending'
    const memberUserId = memberData.userId as string
    const groupName = (groupData.name as string) || 'the group'

    if (joinStatus === 'rejected') {
      await memberRef.delete()
      await notifyUser(
        memberUserId,
        'group_join_rejected',
        'Join request declined',
        `Your request to join "${groupName}" was declined.`
      )
      return NextResponse.json({ success: true, removed: true })
    }

    await memberRef.update(
      sanitizeForFirestore({
        joinStatus: 'active',
        isActive: true,
        approvedBy,
        approvedAt: Timestamp.now(),
      })
    )

    if (wasPending) {
      await groupRef.update({
        memberCount: (groupData.memberCount || 0) + 1,
        updatedAt: Timestamp.now(),
      })
    }

    await notifyUser(
      memberUserId,
      'group_join_approved',
      'Join request approved',
      `You were approved to join "${groupName}". You can now open Join Chat.`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error updating group member:', error)
    return NextResponse.json({ success: false, error: 'Failed to update member' }, { status: 500 })
  }
}
