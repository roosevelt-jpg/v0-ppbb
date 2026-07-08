import { NextRequest, NextResponse } from 'next/server'
import { writeAuditLogServer } from '@/lib/audit-log-server'
import { getRequestAuditContext, type AuditLogInput } from '@/lib/audit-log-shared'

export const dynamic = 'force-dynamic'

/**
 * Server-side audit log write — IP and user-agent captured from request headers.
 * Client SDK must not write to auditLogs directly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuditLogInput
    const ctx = getRequestAuditContext(request)

    if (!body.action || !body.actionType) {
      return NextResponse.json({ success: false, error: 'action and actionType required' }, { status: 400 })
    }

    const id = await writeAuditLogServer({
      ...body,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      deviceBrowser: ctx.deviceBrowser,
      deviceOs: ctx.deviceOs,
      deviceType: ctx.deviceType,
    })

    if (!id) {
      return NextResponse.json({ success: false, error: 'Failed to write audit log' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('[v0] /api/admin/audit-log POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to write audit log' }, { status: 500 })
  }
}
