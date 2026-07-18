import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const snapshot = await getAdminDb().collection('adminUsers').get()
    const admins = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }))

    return NextResponse.json({
      success: true,
      admins,
      count: admins.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching admins:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    const db = getAdminDb()
    await db.collection('adminUsers').doc(id).delete()
    await db.collection('users').doc(id).delete().catch(() => undefined)

    return NextResponse.json({
      success: true,
      message: 'Admin deleted successfully',
    })
  } catch (error) {
    console.error('[v0] Error deleting admin:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete admin' },
      { status: 500 }
    )
  }
}
