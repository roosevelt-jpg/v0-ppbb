import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getIntegration, deleteIntegration, updateIntegrationStatus, saveIntegration } from '@/lib/integrations/handlers'

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

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await verifyAuth(request)
    const integration = await getIntegration(userId, params.serviceId)
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json({ data: integration })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch' },
      { status: 401 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await verifyAuth(request)
    const body = await request.json()
    const { credentials, status } = body

    if (credentials) {
      // Update credentials
      const integration = await saveIntegration(userId, params.serviceId, credentials)
      return NextResponse.json({ success: true, integration })
    } else if (status) {
      // Update status
      await updateIntegrationStatus(userId, params.serviceId, status)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'No credentials or status provided' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = await verifyAuth(request)
    await deleteIntegration(userId, params.serviceId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete' },
      { status: 500 }
    )
  }
}
