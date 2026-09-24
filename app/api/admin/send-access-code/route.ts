import { NextRequest, NextResponse } from 'next/server'
import { paragraphs, sendBrandedEmail } from '@/lib/platform-email'

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, adminName, accessCode } = await request.json()

    if (!adminEmail || !adminName || !accessCode) {
      return NextResponse.json(
        { error: 'Missing required fields: adminEmail, adminName, accessCode' },
        { status: 400 }
      )
    }

    const setupUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.passive-blessings.com'}/admin/setup`
    const result = await sendBrandedEmail({
      to: adminEmail,
      subject: 'Your Passive Blessings Admin Access Code',
      purpose: 'Admin access code',
      greeting: `Hi ${adminName},`,
      bodyHtml: paragraphs(
        'Your admin access code has been generated. Use this code to log in to the Passive Blessings admin dashboard.',
        `Your access code is ${accessCode}.`,
        `Go to setup: ${setupUrl}`,
        'Keep this code confidential. Do not share it with anyone.'
      ),
      cta: { label: 'Admin Setup', url: setupUrl },
    })

    if (!result.ok) {
      console.error('[v0] Access code email failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Email service not available. Configure Zoho Mail SMTP.' },
        { status: 503 }
      )
    }

    console.log('[v0] Access code email sent to:', adminEmail)

    return NextResponse.json({
      success: true,
      message: `Access code sent to ${adminEmail}`,
    })
  } catch (error: unknown) {
    console.error('[v0] Error sending access code email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
