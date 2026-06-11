import { NextRequest, NextResponse } from 'next/server'
import { getAllApiConfigsServer, checkAllServicesHealth } from '@/lib/api-config-server'
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

    const [configs, health] = await Promise.all([
      getAllApiConfigsServer(),
      checkAllServicesHealth(),
    ])
    return NextResponse.json({
      success: true,
      configs,
      health,
      total: configs.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching API configs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API configurations' },
      { status: 500 }
    )
  }
}
