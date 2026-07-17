import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken, getUserProfileData } from '@/lib/admin-access-server'
import { hasAdminAccessServer } from '@/lib/roles-server'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  const profile = await getUserProfileData(uid)
  if (!hasAdminAccessServer(profile || {})) return null
  return uid
}

const ALLOWED_STATUSES = new Set([
  'pending',
  'completed',
  'refunded',
  'cancelled',
  'archived',
])

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing donation id' }, { status: 400 })
    }

    const ref = getAdminDb().collection('donations').doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 })
    }

    if (body.action === 'archive') {
      await ref.set(
        {
          status: 'archived',
          archivedAt: FieldValue.serverTimestamp(),
          archivedBy: adminUid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      return NextResponse.json({ success: true, id, status: 'archived' })
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminUid,
    }

    const stringFields = [
      'donorName',
      'donorEmail',
      'type',
      'purpose',
      'notes',
      'paymentMethod',
      'targetCase',
    ] as const
    for (const key of stringFields) {
      if (typeof body[key] === 'string') {
        patch[key] = body[key].trim()
      }
    }

    if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
      const amount = Number(body.amount)
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
      }
      patch.amount = amount
    }

    if (typeof body.status === 'string' && body.status.trim()) {
      const status = body.status.trim()
      if (!ALLOWED_STATUSES.has(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
      }
      patch.status = status
    }

    await ref.set(patch, { merge: true })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('[admin/donations] PATCH error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const idFromBody = typeof body.id === 'string' ? body.id.trim() : ''
    const idFromQuery = request.nextUrl.searchParams.get('id')?.trim() || ''
    const id = idFromBody || idFromQuery
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing donation id' }, { status: 400 })
    }

    const ref = getAdminDb().collection('donations').doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 })
    }

    await ref.delete()
    return NextResponse.json({ success: true, id, deletedBy: adminUid })
  } catch (error) {
    console.error('[admin/donations] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
