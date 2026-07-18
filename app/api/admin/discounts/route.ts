import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { auditAdminApiAction } from '@/lib/audit-api-helper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  return requireAdminFromRequest(request)
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id : ''
    const action = typeof body.action === 'string' ? body.action : ''

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'id and action required' }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection('discounts').doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Discount not found' }, { status: 404 })
    }

    const current = snap.data() || {}
    const title = (current.title as string) || 'Discount'

    if (action === 'approve') {
      await ref.update(
        sanitizeForFirestore({
          status: 'active',
          approvedAt: Timestamp.now(),
          approvedBy: adminUid,
          updatedAt: Timestamp.now(),
        })
      )
      await auditAdminApiAction(request, adminUid, {
        actionType: 'approve',
        action: `Approved member discount: ${title}`,
        entityType: 'discount',
        entityId: id,
        entityName: title,
        status: 'success',
      })
      return NextResponse.json({ success: true, status: 'active' })
    }

    if (action === 'remove' || action === 'pause') {
      await ref.update(
        sanitizeForFirestore({
          status: action === 'pause' ? 'paused' : 'expired',
          updatedAt: Timestamp.now(),
        })
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[admin/discounts] PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update discount' }, { status: 500 })
  }
}
