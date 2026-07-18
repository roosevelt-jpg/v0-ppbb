import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sendLoginAlertEmail } from '@/lib/member-notifications'

/**
 * Branded sign-in notification after a successful login.
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

    const body = await request.json().catch(() => ({}))
    const method = String(body.method || 'email/password').trim()
    const userAgent =
      String(body.userAgent || '').trim() ||
      request.headers.get('user-agent') ||
      undefined
    const forwarded = request.headers.get('x-forwarded-for') || ''
    const ip = forwarded.split(',')[0]?.trim() || undefined

    const result = await sendLoginAlertEmail({
      userId: uid,
      method,
      userAgent,
      ip,
    })

    return NextResponse.json({ success: result.ok, error: result.error })
  } catch (error) {
    console.error('[email/login-alert]', error)
    return NextResponse.json({ success: false, error: 'Failed to send login alert' }, { status: 500 })
  }
}
