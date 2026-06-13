import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getIntegrationServer, saveIntegrationServer, deleteIntegrationServer, updateIntegrationStatusServer } from '@/lib/integrations/handlers-server'

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string | null = null
    
    try {
      userId = await verifyIdToken(token)
    } catch (authError) {
      console.error('[v0] Auth error:', authError instanceof Error ? authError.message : String(authError))
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const integration = await getIntegrationServer(userId, params.serviceId)
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json({ data: integration })
  } catch (error) {
    console.error('[v0] GET error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string | null = null
    
    try {
      userId = await verifyIdToken(token)
    } catch (authError) {
      console.error('[v0] Auth error:', authError instanceof Error ? authError.message : String(authError))
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { credentials, status } = body

    if (credentials) {
      const integration = await saveIntegrationServer(userId, params.serviceId, credentials)
      return NextResponse.json({ success: true, integration })
    } else if (status && ['active', 'inactive', 'error'].includes(status)) {
      await updateIntegrationStatusServer(userId, params.serviceId, status)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Provide credentials or valid status (active/inactive/error)' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] PATCH error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string | null = null
    
    try {
      userId = await verifyIdToken(token)
    } catch (authError) {
      console.error('[v0] Auth error:', authError instanceof Error ? authError.message : String(authError))
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    await deleteIntegrationServer(userId, params.serviceId)
    return NextResponse.json({ success: true, message: 'Integration deleted' })
  } catch (error) {
    console.error('[v0] DELETE error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
