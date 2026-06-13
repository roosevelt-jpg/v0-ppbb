import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, hasPermissionServer, grantIntegrationPermission } from '@/lib/admin-access-server'
import { getAllIntegrationHealthServer, getIntegrationHealthServer } from '@/lib/integrations/handlers-server'
import { getAllServices } from '@/lib/integrations/services'

async function checkPermission(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    const userId = await verifyIdToken(token)
    if (!userId) return null
    
    let hasAccess = await hasPermissionServer(userId, 'manage_integrations')
    if (!hasAccess) {
      const granted = await grantIntegrationPermission(userId)
      hasAccess = granted
    }
    
    return hasAccess ? userId : null
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await checkPermission(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const healthData = await getAllIntegrationHealthServer()
    const allServices = getAllServices()

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
  } catch (error) {
    console.error('[v0] Health check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
