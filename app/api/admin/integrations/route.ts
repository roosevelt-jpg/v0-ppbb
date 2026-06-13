import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, hasPermissionServer, grantIntegrationPermission } from '@/lib/admin-access-server'
import { saveIntegrationServer, getAllIntegrationsServer, deleteIntegrationServer, updateIntegrationStatusServer } from '@/lib/integrations/handlers-server'
import { redactCredentials } from '@/lib/integrations/encryption'

async function checkPermission(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[v0] No Bearer token')
      return null
    }

    const token = authHeader.substring(7)
    const userId = await verifyIdToken(token)
    
    if (!userId) {
      console.log('[v0] Token verification failed')
      return null
    }

    console.log('[v0] Verified user:', userId)
    
    let hasAccess = await hasPermissionServer(userId, 'manage_integrations')
    console.log('[v0] Initial permission check:', hasAccess)
    
    // If no access, try to grant it for founder_admin
    if (!hasAccess) {
      const granted = await grantIntegrationPermission(userId)
      console.log('[v0] Permission grant attempt:', granted)
      hasAccess = granted
    }
    
    return hasAccess ? userId : null
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const userId = await checkPermission(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[v0] Fetching integrations for', userId)
    const integrations = await getAllIntegrationsServer(userId)
    console.log('[v0] Found integrations:', integrations.length)

    return NextResponse.json({
      data: integrations.map((int) => ({
        ...int,
        credentials: redactCredentials(int.credentials, int.serviceId),
      })),
    })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json({ error: `Failed to fetch integrations: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await checkPermission(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { serviceId, credentials, serviceName } = await request.json()
    console.log('[v0] Saving integration:', serviceId, 'for', userId)

    const integration = await saveIntegrationServer(userId, serviceId, { ...credentials, serviceName })
    
    return NextResponse.json({
      success: true,
      data: {
        ...integration,
        credentials: redactCredentials(integration.credentials, serviceId),
      },
    })
  } catch (error) {
    console.error('[v0] POST error:', error)
    return NextResponse.json({ error: `Failed to save integration: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}
