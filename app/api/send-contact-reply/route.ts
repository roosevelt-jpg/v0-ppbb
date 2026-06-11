import { NextRequest, NextResponse } from 'next/server'
import { getApiConfig } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toEmail, toName, subject, message, contactRequestId, replyDocId } = body

    // Validate required fields
    if (!toEmail || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: toEmail, subject, message' },
        { status: 400 }
      )
    }

    // Get SendGrid configuration from admin settings
    const sendgridConfig = await getApiConfig('sendgrid')
    const apiKey = sendgridConfig?.apiKey

    if (!apiKey) {
      console.error('[v0] SendGrid API key not configured in admin settings')
      return NextResponse.json(
        { error: 'SendGrid not configured. Please add API key in admin settings.' },
        { status: 500 }
      )
    }

    // Send email via SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [
              {
                email: toEmail,
                name: toName,
              },
            ],
            subject: subject,
          },
        ],
        from: {
          email: 'noreply@passiveblessings.ae',
          name: 'Passive Blessings Team',
        },
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f7f6f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #111111; margin: 0 0 10px 0;">Response to Your Inquiry</h2>
                  <p style="color: #888888; margin: 0; font-size: 14px;">Subject: ${subject}</p>
                </div>
                
                <div style="padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 20px;">
                  <p style="color: #333333; line-height: 1.6; white-space: pre-wrap; margin: 0;">
                    ${escapeHtml(message)}
                  </p>
                </div>

                <div style="background-color: #f7f6f2; padding: 20px; border-radius: 8px; margin-top: 20px;">
                  <p style="color: #888888; font-size: 12px; margin: 0;">
                    This is an automated reply to your contact form submission. 
                    If you have any follow-up questions, please reply to this email.
                  </p>
                </div>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #888888; font-size: 12px; margin: 0;">
                    <strong>Passive Blessings</strong><br/>
                    Building community through compassion and collective action<br/>
                    <a href="https://test.myflynai.com" style="color: #111111; text-decoration: none;">Visit our website</a>
                  </p>
                </div>
              </div>
            `,
          },
        ],
        reply_to: {
          email: 'support@passiveblessings.ae',
          name: 'Passive Blessings Support',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[v0] SendGrid error:', errorData)
      return NextResponse.json(
        { error: 'Failed to send email via SendGrid', details: errorData },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      contactRequestId,
      replyDocId,
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
