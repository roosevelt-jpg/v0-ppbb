import { NextRequest, NextResponse } from 'next/server'
import { getAllIntegrationHealthServer } from '@/lib/integrations/handlers-server'
import { getAllServices } from '@/lib/integrations/services'
import {
  verifyIdToken,
  isAdminUser,
  hasInvitePermissionServer,
} from '@/lib/admin-access-server'

const MOCK_USER_ID = 'dev-user-001'

async function requireManageIntegrations(
  request: NextRequest
): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const uid = await verifyIdToken(token)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const isAdmin = await isAdminUser(uid)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const allowed = await hasInvitePermissionServer(uid, 'manage_integrations')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Forbidden: manage_integrations permission required' },
      { status: 403 }
    )
  }
  return { uid }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireManageIntegrations(request)
    if (authResult instanceof NextResponse) return authResult

    const allServices = getAllServices()

    try {
      const healthData = await getAllIntegrationHealthServer()

      // Ensure all services have health records
      const completeHealth = allServices.map((service) => {
        const health = healthData.find((h) => h.serviceId === service.id)
        return (
          health || {
            id: `${service.id}_health`,
            serviceId: service.id,
            serviceName: service.name,
            status: 'not_configured',
            latency: 0,
            lastChecked: new Date(),
            uptime90d: 0,
            incidentCount: 0,
          }
        )
      })

      // Calculate summary stats
      const operational = completeHealth.filter((h) => h.status === 'operational').length
      const degraded = completeHealth.filter((h) => h.status === 'degraded').length
      const down = completeHealth.filter((h) => h.status === 'down').length
      const notConfigured = completeHealth.filter((h) => h.status === 'not_configured').length
      const avgLatency = Math.round(
        completeHealth.filter((h) => h.latency > 0).reduce((sum, h) => sum + h.latency, 0) / 
        Math.max(completeHealth.filter((h) => h.latency > 0).length, 1)
      )

      return NextResponse.json({
        success: true,
        summary: {
          total: completeHealth.length,
          operational,
          degraded,
          down,
          notConfigured,
          avgLatency,
          overallStatus: operational > 0 ? 'operational' : degraded > 0 ? 'degraded' : 'down',
        },
        health: completeHealth,
      })
    } catch (firebaseError) {
      console.error('[v0] Firestore error:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError))
      
      // Return mock health data as fallback
      const completeHealth = allServices.map((service) => ({
        id: `${service.id}_health`,
        serviceId: service.id,
        serviceName: service.name,
        status: 'not_configured',
        latency: 0,
        lastChecked: new Date(),
        uptime90d: 0,
        incidentCount: 0,
      }))

      return NextResponse.json({
        success: true,
        summary: {
          total: completeHealth.length,
          operational: 0,
          degraded: 0,
          down: 0,
          notConfigured: completeHealth.length,
          avgLatency: 0,
          overallStatus: 'not_configured',
        },
        health: completeHealth,
      })
    }
  } catch (error) {
    console.error('[v0] Health check error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
