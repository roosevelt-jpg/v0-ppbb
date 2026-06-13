import { NextRequest, NextResponse } from 'next/server'
import { getIntegration, deleteIntegration, updateIntegrationStatus, saveIntegration } from '@/lib/integrations/handlers'

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = 'test-user-123' // TODO: Extract from Firebase ID token
    const integration = await getIntegration(userId, params.serviceId)
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
    
    return NextResponse.json({ data: integration })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const body = await request.json()
    const { credentials, status } = body
    const userId = 'test-user-123' // TODO: Extract from Firebase ID token

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
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = 'test-user-123' // TODO: Extract from Firebase ID token
    await deleteIntegration(userId, params.serviceId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
