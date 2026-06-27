import { NextRequest, NextResponse } from 'next/server'
import { createGmailTransporter, sendAdminInviteEmail, getGmailSmtpConfig } from '@/lib/gmail-service'

interface SendAdminInviteRequest {
  adminName: string
  adminEmail: string
  role: 'admin' | 'super_admin'
  permissions: string[]
  accessCode: string
  expiresAt: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendAdminInviteRequest

    console.log('[v0] Processing admin invite for:', body.adminEmail)

    // Load Gmail SMTP from integrations collection
    const gmailConfig = await getGmailSmtpConfig()

    if (!gmailConfig?.gmailEmail || !gmailConfig?.gmailAppPassword) {
      console.error('[v0] Gmail SMTP not configured in integrations')
      return NextResponse.json({
        success: false,
        error: 'Email service not configured. Please configure Gmail SMTP in Admin > Integrations.',
      }, { status: 503 })
    }

    console.log('[v0] Gmail SMTP config loaded from integrations')

    // Create Gmail transporter with loaded credentials
    const transporter = createGmailTransporter({
      enabled: true,
      gmailEmail: gmailConfig.gmailEmail,
      gmailAppPassword: gmailConfig.gmailAppPassword,
    } as any)

    if (!transporter) {
      console.error('[v0] Failed to create Gmail transporter')
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize email service. Check your Gmail configuration.',
      }, { status: 500 })
    }

    // Send the admin invite email
    const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://test.myflynai.com'}/admin/setup`

    const result = await sendAdminInviteEmail(transporter, gmailConfig.gmailEmail, {
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      role: body.role,
      permissions: body.permissions,
      accessCode: body.accessCode,
      expiresAt: new Date(body.expiresAt),
      setupUrl,
      fromName: gmailConfig.fromName || 'Passive Blessings',
    })

    console.log('[v0] Admin invite email sent successfully:', result.messageId)

    return NextResponse.json({
      success: true,
      message: `Invitation email sent to ${body.adminEmail}`,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('[v0] Error sending admin invite email:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      error: `Failed to send invitation email: ${errorMessage}`,
    }, { status: 500 })
  }
}
