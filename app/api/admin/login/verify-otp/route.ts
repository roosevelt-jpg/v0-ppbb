import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { verifyAdminLoginOtp } from '@/lib/admin-login-otp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verify the 6-digit admin login code (step 3).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdminUser(uid))) {
      return NextResponse.json({ success: false, error: 'Not an admin account' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const code = String(body.code || '').trim()
    const result = await verifyAdminLoginOtp({ uid, code })
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid code' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Login verified' })
  } catch (error) {
    console.error('[admin/login/verify-otp]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify login code' },
      { status: 500 }
    )
  }
}
