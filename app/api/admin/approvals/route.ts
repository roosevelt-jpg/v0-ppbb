import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import {
  loadPendingApprovals,
  processApprovalAction,
  type ApprovalItemType,
} from '@/lib/admin-approvals-server'

export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  return (await isAdminUser(uid)) ? uid : null
}

export async function GET(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const items = await loadPendingApprovals()
    return NextResponse.json({ success: true, data: items, total: items.length })
  } catch (error) {
    console.error('[api/admin/approvals GET]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load approvals' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      type?: ApprovalItemType
      id?: string
      action?: 'approve' | 'reject'
      communityId?: string
      notes?: string
    }

    const type = body.type
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const action = body.action

    if (!type || !id || !action) {
      return NextResponse.json(
        { success: false, error: 'type, id, and action are required' },
        { status: 400 }
      )
    }

    const result = await processApprovalAction(adminUid, {
      type,
      id,
      action,
      communityId: body.communityId,
      notes: body.notes,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Action failed' }, { status: 400 })
    }

    await auditAdminApiAction(request, adminUid, {
      actionType: action === 'approve' ? 'approve' : 'reject',
      action: `${action === 'approve' ? 'Approved' : 'Rejected'} ${type}: ${id}`,
      entityType: type,
      entityId: id,
      status: 'success',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[api/admin/approvals PATCH]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 }
    )
  }
}
