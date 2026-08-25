import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const raw = context.params
    const params = typeof (raw as Promise<{ id: string }>).then === 'function' ? await (raw as Promise<{ id: string }>) : (raw as { id: string })
    const { id } = params
    if (!id) return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    const db = getAdminDb()
    await db.collection('adminUsers').doc(id).delete()
    await db.collection('users').doc(id).delete().catch(() => undefined)
    return NextResponse.json({ success: true, message: 'Admin deleted successfully' })
  } catch (error) {
    console.error('[v0] Error deleting admin:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete admin' }, { status: 500 })
  }
}
