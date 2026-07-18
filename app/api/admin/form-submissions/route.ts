import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_STATUSES = new Set(['pending', 'reviewed', 'approved', 'rejected'])

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  return (await isAdminUser(uid)) ? uid : null
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      id?: string
      status?: string
      notes?: string
    }

    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const status = typeof body.status === 'string' ? body.status.trim() : ''
    const notes = typeof body.notes === 'string' ? body.notes : undefined

    if (!id || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, error: 'id and a valid status are required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const ref = db.collection('formSubmissions').doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 })
    }

    const payload = sanitizeForFirestore({
      status,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: adminUid,
      updatedAt: FieldValue.serverTimestamp(),
      ...(notes !== undefined ? { notes } : {}),
    })

    await ref.update(payload)

    await auditAdminApiAction(request, adminUid, {
      actionType: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'update',
      action: `Form submission ${id} marked ${status}`,
      entityType: 'form_submission',
      entityId: id,
      status: 'success',
    })

    return NextResponse.json({ success: true, data: { id, status } })
  } catch (error) {
    console.error('[api/admin/form-submissions PATCH]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update submission',
      },
      { status: 500 }
    )
  }
}
