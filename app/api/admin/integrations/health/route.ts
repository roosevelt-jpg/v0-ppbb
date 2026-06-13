import { NextRequest, NextResponse } from 'next/server'
import { getAllServices } from '@/lib/integrations/services'

export async function GET(request: NextRequest) {
  try {
    const allServices = getAllServices()

    // Return mock health for all services
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

    const operational = 0
    const degraded = 0
    const down = 0
    const notConfigured = completeHealth.length
    const avgLatency = 0

    return NextResponse.json({
      success: true,
      summary: {
        total: completeHealth.length,
        operational,
        degraded,
        down,
        notConfigured,
        avgLatency,
        overallStatus: 'not_configured',
      },
      health: completeHealth,
    })
  } catch (error) {
    console.error('[v0] Health check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
