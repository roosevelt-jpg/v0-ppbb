import { NextRequest, NextResponse } from 'next/server'
import { logAdminLogin } from '@/lib/admin-login-tracking'
import { auditFromApiRequest } from '@/lib/audit-log-server'
import { formatAdminRoleLabel } from '@/lib/audit-log-shared'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      adminId,
      adminEmail,
      adminName,
      status,
      accessCodeId,
      failureReason,
    } = body

    if (!adminId || !adminEmail || !adminName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('cf-connecting-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log the login attempt
    const loginLog = await logAdminLogin(
      adminId,
      adminEmail,
      adminName,
      ipAddress,
      userAgent,
      status || 'success',
      accessCodeId,
      failureReason
    )

    if (!loginLog) {
      return NextResponse.json(
        { error: 'Failed to log login attempt' },
        { status: 500 }
      )
    }

    const isSuccess = (status || 'success') === 'success'
    await auditFromApiRequest(request, {
      adminId,
      adminEmail,
      adminName,
      adminRole: 'admin',
      actionType: isSuccess ? 'login' : 'login_failed',
      action: isSuccess ? 'Admin login successful' : 'Admin login failed',
      entityType: 'auth',
      status: isSuccess ? 'success' : 'failed',
      failureReason: failureReason || '',
      details: accessCodeId ? `Access code setup: ${accessCodeId}` : '',
    })

    return NextResponse.json({
      success: true,
      log: loginLog,
      sessionId: loginLog.sessionId,
    })
  } catch (error) {
    console.error('[v0] Login logging error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to log login' },
      { status: 500 }
    )
  }
}
