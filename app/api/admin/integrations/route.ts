import { NextRequest, NextResponse } from 'next/server'
import { saveIntegrationServer, getAllIntegrationsServer } from '@/lib/integrations/handlers-server'

const MOCK_USER_ID = 'dev-user-001'

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] GET /api/admin/integrations')
    const userId = MOCK_USER_ID

    const integrations = await getAllIntegrationsServer(userId)
    return NextResponse.json({
      data: integrations,
      message: 'Integrations retrieved successfully',
      count: integrations.length
    })
  } catch (error) {
    console.error('[v0] GET error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve integrations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/admin/integrations')

    const body = await request.json()
    const { serviceId, credentials } = body

    if (!serviceId || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields (serviceId, credentials)' },
        { status: 400 }
      )
    }

    console.log('[v0] POST: Saving integration', serviceId)
    const userId = MOCK_USER_ID

    // Let the error propagate — don't silently swallow Firestore failures
    const integration = await saveIntegrationServer(userId, serviceId, credentials)
    console.log('[v0] Integration saved successfully')

    return NextResponse.json({
      success: true,
      message: 'Integration saved successfully',
      integration: {
        id: integration.id,
        serviceId: integration.serviceId,
        status: integration.status,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[v0] POST error:', errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
