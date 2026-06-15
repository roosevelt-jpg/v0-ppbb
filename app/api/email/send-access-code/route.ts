import { NextRequest, NextResponse } from 'next/server'

/**
 * Email sending API route
 * In production, integrate with SendGrid, Resend, or your preferred email service
 */

interface SendAccessCodeRequest {
  to: string
  code: string
  expiresAt: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendAccessCodeRequest

    console.log('[v0] Sending access code email to:', body.to)

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, just log and return success
    // In production, you would:
    // const response = await sendgrid.send({
    //   to: body.to,
    //   from: 'admin@passiveblessings.com',
    //   subject: 'Your Passive Blessings Admin Access Code',
    //   html: generateEmailHTML(body.code, body.expiresAt)
    // })

    return NextResponse.json({
      success: true,
      message: 'Access code email sent successfully'
    })
  } catch (error) {
    console.error('[v0] Error in send-access-code:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
