import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid || !(await isAdminUser(uid))) return null
  return uid
}

const PENDING_STATUSES = ['pending_approval', 'pending'] as const

async function loadPendingCommunities() {
  const db = getAdminDb()
  const byId = new Map<string, Record<string, unknown>>()

  for (const status of PENDING_STATUSES) {
    try {
      const snap = await db.collection('communities').where('status', '==', status).limit(200).get()
      for (const d of snap.docs) {
        byId.set(
          d.id,
          serializeFirestoreDoc(d.id, {
            type: 'community',
            ...(d.data() as Record<string, unknown>),
          }) as Record<string, unknown>
        )
      }
    } catch (error) {
      console.warn(`[community-approvals] communities status=${status} query failed:`, error)
    }
  }

  return Array.from(byId.values())
}

async function loadPendingGroups() {
  const db = getAdminDb()
  const groups: Record<string, unknown>[] = []

  for (const status of PENDING_STATUSES) {
    try {
      const snap = await db.collectionGroup('groups').where('status', '==', status).limit(200).get()
      for (const d of snap.docs) {
        const communityId = d.ref.parent.parent?.id || ''
        groups.push(
          serializeFirestoreDoc(d.id, {
            type: 'group',
            communityId,
            ...(d.data() as Record<string, unknown>),
          }) as Record<string, unknown>
        )
      }
    } catch (error) {
      // Missing COLLECTION_GROUP index must not block community approvals.
      console.warn(`[community-approvals] groups status=${status} query failed:`, error)
    }
  }

  return groups
}

/** GET pending communities & groups awaiting admin approval */
export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdmin(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [communities, groups] = await Promise.all([
      loadPendingCommunities(),
      loadPendingGroups(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        communities,
        groups,
        total: communities.length + groups.length,
      },
    })
  } catch (error) {
    console.error('[community-approvals GET]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load approvals',
      },
      { status: 500 }
    )
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
      await db.collection('communities').doc(id).set(
        {
          status: nextStatus,
          approvalReason: reason || null,
          approvedBy: uid,
          approvedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          ...(action === 'reject' ? { rejectionReason: reason || 'Rejected by admin' } : {}),
        },
        { merge: true }
      )
    } else {
      if (!communityId) {
        return NextResponse.json(
          { success: false, error: 'communityId required for groups' },
          { status: 400 }
        )
      }
      await db
        .collection('communities')
        .doc(communityId)
        .collection('groups')
        .doc(id)
        .set(
          {
            status: nextStatus,
            approvalReason: reason || null,
            approvedBy: uid,
            approvedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            ...(action === 'reject' ? { rejectionReason: reason || 'Rejected by admin' } : {}),
          },
          { merge: true }
        )
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Approval action failed',
      },
      { status: 500 }
    )
  }
}
