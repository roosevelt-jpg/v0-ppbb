import { NextRequest, NextResponse } from 'next/server'
import { checkAllServicesHealth } from '@/lib/api-config'

export async function GET(request: NextRequest) {
  try {
    const health = await checkAllServicesHealth()

    return NextResponse.json({
      success: true,
      health,
      total: health.length,
      healthy: health.filter((h) => h.status === 'healthy').length,
      degraded: health.filter((h) => h.status === 'degraded').length,
      down: health.filter((h) => h.status === 'down').length,
    })
  } catch (error) {
    console.error('[v0] Error checking health:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check health' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const health = await checkAllServicesHealth()

    return NextResponse.json({
      success: true,
      health,
      total: health.length,
      healthy: health.filter((h) => h.status === 'healthy').length,
      degraded: health.filter((h) => h.status === 'degraded').length,
      down: health.filter((h) => h.status === 'down').length,
    })
  } catch (error) {
    console.error('[v0] Error checking health:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check health' },
      { status: 500 }
    )
  }
}
