import { NextRequest, NextResponse } from 'next/server'
import { sendRawZohoEmail } from '@/lib/gmail-service'
import { getSiteUrl } from '@/lib/site-metadata'

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

    const siteUrl = getSiteUrl()
    const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f7f6f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #111111; margin: 0 0 10px 0;">Response to Your Inquiry</h2>
                  <p style="color: #888888; margin: 0; font-size: 14px;">Subject: ${escapeHtml(subject)}</p>
                </div>
                <div style="padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 20px;">
                  <p style="color: #333333; line-height: 1.6; white-space: pre-wrap; margin: 0;">
                    ${escapeHtml(message)}
                  </p>
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #888888; font-size: 12px; margin: 0;">
                    <strong>Passive Blessings</strong><br/>
                    Dubai, United Arab Emirates<br/>
                    <a href="${escapeHtml(siteUrl)}" style="color: #111111; text-decoration: none;">Visit our website</a>
                  </p>
                </div>
              </div>
            `

    try {
      await sendRawZohoEmail({
        to: toEmail,
        subject,
        html,
        text: message,
      })
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

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
