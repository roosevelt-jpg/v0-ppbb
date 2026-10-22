import { NextRequest, NextResponse } from 'next/server'
import { paragraphs, sendBrandedEmail } from '@/lib/platform-email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toEmail, toName, subject, message, contactRequestId, replyDocId } = body

    if (!toEmail || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: toEmail, subject, message' },
        { status: 400 }
      )
    }

    const lines = String(message)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
    try {
      const result = await sendBrandedEmail({
        to: toEmail,
        subject,
        purpose: 'Contact reply',
        greeting: toName ? `Hi ${toName},` : undefined,
        headline: 'Response to your inquiry',
        bodyHtml: paragraphs(...(lines.length ? lines : [String(message)])),
      })
      if (!result.ok) throw new Error(result.error || 'Failed to send email')
    } catch (error) {
      console.error('[v0] Zoho contact reply failed:', error)
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to send email via Zoho Mail SMTP. Configure Admin → Integrations → Zoho Mail SMTP.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      contactRequestId,
      replyDocId,
      toName: toName || null,
    })
  } catch (error) {
    console.error('[v0] Error sending email:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
