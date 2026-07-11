import { NextRequest, NextResponse } from 'next/server'
import { dispatchAdminInviteEmail } from '@/lib/gmail-service'

interface InviterProfile {
  name: string
  roleLabel: string
  profilePictureURL?: string | null
  initials: string
}

interface SendAdminInviteRequest {
  adminName: string
  adminEmail: string
  role: string
  permissions: string[]
  accessCode: string
  expiresAt: string
  invitedBy?: InviterProfile | null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendAdminInviteRequest

    if (!body.adminEmail || !body.accessCode || !body.adminName) {
      return NextResponse.json(
        { success: false, error: 'Missing adminName, adminEmail, or accessCode' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing admin invite for:', body.adminEmail)

    const result = await dispatchAdminInviteEmail({
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      role: body.role || 'admin',
      permissions: Array.isArray(body.permissions) ? body.permissions : [],
      accessCode: body.accessCode,
      expiresAt: new Date(body.expiresAt || Date.now() + 24 * 60 * 60 * 1000),
      invitedBy: body.invitedBy || undefined,
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

    return NextResponse.json(
      {
        success: false,
        error: `Failed to send invitation email: ${errorMessage}`,
      },
      { status: 500 }
    )
  }
}
