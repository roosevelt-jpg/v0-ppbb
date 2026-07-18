import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sendEmailVerificationBranded } from '@/lib/member-notifications'

/**
 * Send branded email verification after signup.
 * Auth required — only the signed-in user can request their own verification mail.
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
    const firstName = String(body.firstName || '').trim()

    const { getAuth } = await import('firebase-admin/auth')
    const { getAdminApp } = await import('@/lib/firebase-admin')
    const user = await getAuth(getAdminApp()).getUser(uid)
    const email = String(user.email || '').trim().toLowerCase()
    if (!email.includes('@')) {
      return NextResponse.json({ success: false, error: 'No email on account' }, { status: 400 })
    }
    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    const result = await sendEmailVerificationBranded({ email, firstName })
    return NextResponse.json({ success: result.ok, error: result.error })
  } catch (error) {
    console.error('[auth/send-verification]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
