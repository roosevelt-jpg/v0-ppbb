import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import type { MemberModerationStatus } from '@/lib/community-governance'

export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest) {
  return requireAdminFromRequest(request)
}

/**
 * PATCH /api/admin/community-members
 * Admin moderation: suspend, ban, remove, or restore a member/business in a community or group.
 */
export async function PATCH(request: NextRequest) {
  try {
    const uid = await requireAdmin(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      communityId,
      groupId,
      memberDocId,
      userId,
      action,
      reason,
      suspendDays,
    } = body as {
      communityId?: string
      groupId?: string
      memberDocId?: string
      userId?: string
      action?: 'suspend' | 'ban' | 'remove' | 'restore'
      reason?: string
      suspendDays?: number
    }

    if (!communityId || !action) {
      return NextResponse.json(
        { success: false, error: 'communityId and action required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const membersRef = groupId
      ? db
          .collection('communities')
          .doc(communityId)
          .collection('groups')
          .doc(groupId)
          .collection('members')
      : db.collection('communities').doc(communityId).collection('members')

    let memberRef
    if (memberDocId) {
      memberRef = membersRef.doc(memberDocId)
    } else if (userId) {
      const snap = await membersRef.where('userId', '==', userId).limit(1).get()
      if (snap.empty) {
        return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
      }
      memberRef = snap.docs[0].ref
    } else {
      return NextResponse.json(
        { success: false, error: 'memberDocId or userId required' },
        { status: 400 }
      )
    }

    const memberSnap = await memberRef.get()
    if (!memberSnap.exists) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    let memberStatus: MemberModerationStatus = 'active'
    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
      moderatedBy: uid,
      moderationReason: reason || null,
    }

    switch (action) {
      case 'suspend': {
        memberStatus = 'suspended'
        const days = Number(suspendDays) || 7
        updates.suspendedUntil = Timestamp.fromDate(
          new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        )
        updates.isActive = false
        updates.joinStatus = 'rejected'
        break
      }
      case 'ban':
        memberStatus = 'banned'
        updates.isActive = false
        updates.joinStatus = 'rejected'
        updates.suspendedUntil = null
        break
      case 'remove':
        memberStatus = 'removed'
        updates.isActive = false
        updates.joinStatus = 'rejected'
        break
      case 'restore':
        memberStatus = 'active'
        updates.isActive = true
        updates.joinStatus = 'active'
        updates.suspendedUntil = null
        break
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    updates.memberStatus = memberStatus

    await memberRef.update(updates)

    await auditAdminApiAction(request, uid, {
      actionType: action === 'restore' ? 'update' : 'reject',
      action: `Community moderation ${action} for user ${memberSnap.data()?.userId || userId}`,
      entityType: 'community',
      entityId: communityId,
      status: 'success',
      details: reason || action,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[community-members PATCH]', error)
    return NextResponse.json({ success: false, error: 'Moderation action failed' }, { status: 500 })
  }
}
