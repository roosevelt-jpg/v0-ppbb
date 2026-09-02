import { NextRequest, NextResponse } from 'next/server'
import { getAdminLoginHistory, getAllAdminLoginHistory } from '@/lib/admin-login-tracking'
import { doc, getDoc } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const adminId = searchParams.get('adminId')
    const isSuperAdmin = searchParams.get('isSuperAdmin') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!adminId) {
      return NextResponse.json(
        { error: 'adminId is required' },
        { status: 400 }
      )
    }

    // Verify user is either viewing their own logs or is super admin
    if (!isSuperAdmin) {
      const requestingAdmin = await getDoc(doc(db, 'users', adminId))

      if (!requestingAdmin.exists) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }

    // Get login history
    const history = isSuperAdmin
      ? await getAllAdminLoginHistory(limit)
      : await getAdminLoginHistory(adminId, limit)

    return NextResponse.json({
      success: true,
      logs: history,
      count: history.length,
    })
  } catch (error) {
    console.error('[v0] Login history retrieval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve logs' },
      { status: 500 }
    )
  }
}
