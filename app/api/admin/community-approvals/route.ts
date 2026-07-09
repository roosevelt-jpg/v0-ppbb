import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { auditAdminApiAction } from '@/lib/audit-api-helper'

export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid || !(await isAdminUser(uid))) return null
  return uid
}

/** GET pending communities & groups awaiting admin approval */
export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdmin(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const [communitySnap, groupSnap] = await Promise.all([
      db.collection('communities').where('status', '==', 'pending_approval').get(),
      db.collectionGroup('groups').where('status', '==', 'pending_approval').get(),
    ])

    const communities = communitySnap.docs.map((d) => ({
      id: d.id,
      type: 'community' as const,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? d.data().createdAt,
    }))

    const groups = groupSnap.docs.map((d) => {
      const communityId = d.ref.parent.parent?.id
      return {
        id: d.id,
        communityId,
        type: 'group' as const,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? d.data().createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: { communities, groups, total: communities.length + groups.length },
    })
  } catch (error) {
    console.error('[community-approvals GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to load approvals' }, { status: 500 })
  }
}

/** PATCH approve or reject pending community / group */
export async function PATCH(request: NextRequest) {
  try {
    const uid = await requireAdmin(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id, communityId, action, reason } = body as {
      type?: 'community' | 'group'
      id?: string
      communityId?: string
      action?: 'approve' | 'reject'
      reason?: string
    }

    if (!type || !id || !action) {
      return NextResponse.json(
        { success: false, error: 'type, id, and action required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const nextStatus = action === 'approve' ? 'active' : 'archived'

    if (type === 'community') {
      await db.collection('communities').doc(id).update({
        status: nextStatus,
        approvalReason: reason || null,
        approvedBy: uid,
        approvedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(action === 'reject' ? { rejectionReason: reason || 'Rejected by admin' } : {}),
      })
    } else {
      if (!communityId) {
        return NextResponse.json({ success: false, error: 'communityId required for groups' }, { status: 400 })
      }
      await db
        .collection('communities')
        .doc(communityId)
        .collection('groups')
        .doc(id)
        .update({
          status: nextStatus,
          approvalReason: reason || null,
          approvedBy: uid,
          approvedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          ...(action === 'reject' ? { rejectionReason: reason || 'Rejected by admin' } : {}),
        })
    }

    await auditAdminApiAction(request, uid, {
      actionType: action === 'approve' ? 'approve' : 'reject',
      action: `${action === 'approve' ? 'Approved' : 'Rejected'} ${type}: ${id}`,
      entityType: 'community',
      entityId: id,
      status: 'success',
      details: reason || '',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[community-approvals PATCH]', error)
    return NextResponse.json({ success: false, error: 'Approval action failed' }, { status: 500 })
  }
}
