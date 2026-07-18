import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetBranded } from '@/lib/member-notifications'

/**
 * Public branded password reset (forgot password).
 * Always returns success when the email looks valid to avoid account enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const result = await sendPasswordResetBranded({ email })
    if (!result.ok) {
      // Still return success to the client for enumeration safety when user missing;
      // only fail hard on transport errors after a known user.
      console.error('[auth/send-password-reset]', result.error)
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    })
  } catch (error) {
    console.error('[auth/send-password-reset]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send password reset email. Please try again.' },
      { status: 500 }
    )
  }
}
