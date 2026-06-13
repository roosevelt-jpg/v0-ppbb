import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { saveIntegration, getAllIntegrations } from '@/lib/integrations/handlers'

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing authorization header')
  }

  const token = authHeader.substring(7)
  const userId = await verifyIdToken(token)
  if (!userId) {
    throw new Error('Invalid token')
  }
  return userId
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request)
    const integrations = await getAllIntegrations(userId)
    
    return NextResponse.json({
      data: integrations,
      message: 'Integrations retrieved successfully'
    })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch integrations' },
      { status: 401 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request)
    const { serviceId, credentials, serviceName } = await request.json()

    if (!serviceId || !credentials) {
      return NextResponse.json(
        { error: 'Missing serviceId or credentials' },
        { status: 400 }
      )
    }

    console.log('[v0] Saving integration for user:', userId, 'service:', serviceId)

    const integration = await saveIntegration(userId, serviceId, credentials)

    return NextResponse.json({
      success: true,
      message: 'Integration saved successfully',
      integration
    })
  } catch (error) {
    console.error('[v0] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save integration' },
      { status: 500 }
    )
  }
}
