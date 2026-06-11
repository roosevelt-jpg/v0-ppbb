import { NextRequest, NextResponse } from 'next/server'
import { checkAllServicesHealth } from '@/lib/api-config-server'
import { hasPermission } from '@/lib/admin-access'
import { getAuth } from 'firebase-admin/auth'

async function checkIntegrationPermission(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid

    const hasAccess = await hasPermission(userId, 'manage_integrations')
    return hasAccess ? userId : null
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await checkIntegrationPermission(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
    const userId = await checkIntegrationPermission(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
