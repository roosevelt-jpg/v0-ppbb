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
      // sendPasswordResetBranded already normalizes "no such user" to ok:true
      // for enumeration safety — result.ok === false here always means a real
      // send failure (e.g. Gmail SMTP not configured in Admin -> Integrations),
      // not that the account doesn't exist. Telling the user "check your email"
      // for a link that was never sent left them with no way to know or recover.
      console.error('[auth/send-password-reset]', result.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Could not send the reset email right now. Please try again shortly or contact support.',
        },
        { status: 502 }
      )
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
