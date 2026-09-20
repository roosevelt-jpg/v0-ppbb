import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminDb } from '@/lib/firebase-admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id?.trim()) {
      return NextResponse.json({ success: false, error: 'Template id required' }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection('certificateTemplates').doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    await ref.delete()
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('[certificates/templates DELETE]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete certificate template' },
      { status: 500 }
    )
  }
}
