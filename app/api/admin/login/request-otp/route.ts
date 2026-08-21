import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser, getAdminUserData } from '@/lib/admin-access-server'
import { createAndSendAdminLoginOtp } from '@/lib/admin-login-otp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * After email + password Firebase sign-in, send a branded 6-digit admin login code.
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

    const data = await getAdminUserData(uid)
    const body = await request.json().catch(() => ({}))
    const email = String(data?.email || body.email || '')
      .trim()
      .toLowerCase()
    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Admin account has no email on file' },
        { status: 400 }
      )
    }

    const name = String(
      data?.adminName ||
        data?.displayName ||
        `${data?.firstName || ''} ${data?.lastName || ''}`.trim() ||
        ''
    ).trim()

    const result = await createAndSendAdminLoginOtp({ uid, email, adminName: name })
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send login code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      email,
      expiresAt: result.expiresAt,
      emailSkipped: Boolean(result.emailSkipped),
      message: result.emailSkipped
        ? 'Gmail SMTP is not configured — login code skipped. Configure Admin → Integrations → Gmail SMTP.'
        : 'Login code sent to your email',
    })
  } catch (error) {
    console.error('[admin/login/request-otp]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send login code' },
      { status: 500 }
    )
  }
}
