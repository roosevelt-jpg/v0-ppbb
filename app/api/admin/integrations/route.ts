import { NextRequest, NextResponse } from 'next/server'
import { saveIntegrationServer, getAllIntegrationsServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import { requireIntegrationsAccess } from '@/lib/integrations/require-vault-access'
import { auditAdminApiAction } from '@/lib/audit-api-helper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MOCK_USER_ID = INTEGRATION_OWNER_USER_ID

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] GET /api/admin/integrations')
    const authResult = await requireIntegrationsAccess(request)
    if (authResult instanceof NextResponse) return authResult

    const integrations = await getAllIntegrationsServer(MOCK_USER_ID)
    return NextResponse.json({
      data: integrations,
      message: 'Integrations retrieved successfully',
      count: integrations.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] GET error:', message)
    return NextResponse.json(
      {
        error: message || 'Failed to retrieve integrations',
        hint: 'Credentials are stored in Firestore and were not deleted. Retry after deploy, or check server logs.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/admin/integrations')

    const authResult = await requireIntegrationsAccess(request)
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()
    const { serviceId, credentials } = body

    if (!serviceId || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields (serviceId, credentials)' },
        { status: 400 }
      )
    }

    console.log('[v0] POST: Saving integration', serviceId)

    const integration = await saveIntegrationServer(MOCK_USER_ID, serviceId, credentials)
    console.log('[v0] Integration saved successfully')

    await auditAdminApiAction(request, authResult.uid, {
      actionType: 'update',
      action: `Saved integration: ${serviceId}`,
      entityType: 'integration',
      entityId: serviceId,
      entityName: serviceId,
      status: 'success',
    })

    return NextResponse.json({
      success: true,
      message: 'Integration saved successfully',
      integration: {
        id: integration.id,
        serviceId: integration.serviceId,
        status: integration.status,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[v0] POST error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
