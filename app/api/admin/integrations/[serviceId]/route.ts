import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, hasPermissionServer, grantIntegrationPermission } from '@/lib/admin-access-server'
import { getIntegration, deleteIntegration, updateIntegrationStatus } from '@/lib/integrations/handlers'
import { redactCredentials } from '@/lib/integrations/encryption'

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

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await checkPermission(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const integration = await getIntegration(userId, params.serviceId)
    if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: {
        ...integration,
        credentials: redactCredentials(integration.credentials, params.serviceId),
      },
    })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await checkPermission(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await deleteIntegration(userId, params.serviceId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await checkPermission(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { status, testResult } = body

    await updateIntegrationStatus(userId, params.serviceId, status, testResult)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
