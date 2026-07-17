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

const ALLOWED_STATUSES = new Set(['pending', 'under_review', 'approved', 'declined', 'active', 'ended'])

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing partnership id' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      reviewedBy: adminUid,
      reviewedAt: FieldValue.serverTimestamp(),
    }

    if (typeof body.status === 'string' && body.status.trim()) {
      const status = body.status.trim()
      if (!ALLOWED_STATUSES.has(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
      }
      patch.status = status
    }

    if (typeof body.adminNotes === 'string') {
      patch.adminNotes = body.adminNotes.trim() || null
    }

    if (!('status' in patch) && !('adminNotes' in patch)) {
      return NextResponse.json(
        { success: false, error: 'Provide status and/or adminNotes' },
        { status: 400 }
      )
    }

    const ref = getAdminDb().collection('partnerships').doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Partnership not found' }, { status: 404 })
    }

    await ref.set(patch, { merge: true })
    return NextResponse.json({
      success: true,
      id,
      status: (patch.status as string | undefined) || snap.data()?.status || null,
      adminNotes: 'adminNotes' in patch ? patch.adminNotes : snap.data()?.adminNotes ?? null,
    })
  } catch (error) {
    console.error('[admin/partnerships] PATCH error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
