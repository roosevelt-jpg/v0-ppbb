import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import {
  loadIntegrationAnalytics,
  resolveIntegrationAlert,
} from '@/lib/integration-analytics-server'

export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  return (await isAdminUser(uid)) ? uid : null
}

export async function GET(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const serviceId = request.nextUrl.searchParams.get('serviceId') || ''
    const hours = Math.min(
      720,
      Math.max(1, Number(request.nextUrl.searchParams.get('hours') || 24) || 24)
    )

    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'serviceId required' }, { status: 400 })
    }

    const data = await loadIntegrationAnalytics(serviceId, hours)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[api/admin/integration-analytics GET]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load analytics' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { alertId?: string }
    const alertId = typeof body.alertId === 'string' ? body.alertId.trim() : ''
    if (!alertId) {
      return NextResponse.json({ success: false, error: 'alertId required' }, { status: 400 })
    }

    const ok = await resolveIntegrationAlert(alertId)
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[api/admin/integration-analytics PATCH]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to resolve alert' },
      { status: 500 }
    )
  }
}
