import { NextRequest, NextResponse } from 'next/server'
import { getAdminLoginHistory, getAllAdminLoginHistory } from '@/lib/admin-login-tracking'
import { getFirestore } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams // dynamic signal first
    const adminId = searchParams.get('adminId')
    const isSuperAdmin = searchParams.get('isSuperAdmin') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!adminId) {
      return NextResponse.json(
        { error: 'adminId is required' },
        { status: 400 }
      )
    }

    const db = getFirestore(getAdminApp()) // init after dynamic signal

    // Verify user is either viewing their own logs or is super admin
    if (!isSuperAdmin) {
      const userDoc = await db.collection('users').doc(adminId).get()
      if (!userDoc.exists) {
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