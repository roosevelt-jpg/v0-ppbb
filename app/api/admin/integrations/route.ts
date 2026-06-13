import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { saveIntegrationServer, getAllIntegrationsServer } from '@/lib/integrations/handlers-server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('[v0] Verifying token...')
    const userId = await verifyIdToken(token)
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    console.log('[v0] GET integrations for user:', userId)
    const integrations = await getAllIntegrationsServer(userId)
    
    return NextResponse.json({
      data: integrations,
      message: 'Integrations retrieved successfully',
      count: integrations.length
    })
  } catch (error) {
    console.error('[v0] GET error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[v0] Missing auth header')
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('[v0] POST: Verifying token...')
    const userId = await verifyIdToken(token)
    
    if (!userId) {
      console.log('[v0] Token verification failed')
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, credentials } = body

    if (!serviceId || !credentials) {
      console.log('[v0] Missing required fields')
      return NextResponse.json({ error: 'Missing required fields (serviceId, credentials)' }, { status: 400 })
    }

    console.log('[v0] POST: Saving integration', serviceId, 'for user', userId)
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
    const errorStack = error instanceof Error ? error.stack : 'No stack'
    console.error('[v0] POST error:', { message: errorMessage, stack: errorStack })
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
