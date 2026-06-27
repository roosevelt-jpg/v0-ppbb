import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/db-service'
import { createGmailTransporter, sendAdminInviteEmail } from '@/lib/gmail-service'

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

    // Get site settings with email config
    const settings = await getSettings()

    if (!settings?.emailConfig?.enabled) {
      console.warn('[v0] Email not configured in settings')
      return NextResponse.json({
        success: false,
        error: 'Email service not configured. Please configure Gmail SMTP in admin settings.',
      }, { status: 400 })
    }

    // Create Gmail transporter
    const transporter = createGmailTransporter(settings.emailConfig)

    if (!transporter) {
      console.error('[v0] Failed to create Gmail transporter')
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize email service. Check your Gmail configuration.',
      }, { status: 500 })
    }

    // Send the admin invite email
    const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://test.myflynai.com'}/admin/setup`

    const result = await sendAdminInviteEmail(transporter, settings.emailConfig.gmailEmail!, {
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      role: body.role,
      permissions: body.permissions,
      accessCode: body.accessCode,
      expiresAt: new Date(body.expiresAt),
      setupUrl,
      fromName: settings.siteName || 'Passive Blessings',
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
