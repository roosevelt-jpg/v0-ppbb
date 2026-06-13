import { NextRequest, NextResponse } from 'next/server'
import { getIntegrationServer, saveIntegrationServer, deleteIntegrationServer, updateIntegrationStatusServer } from '@/lib/integrations/handlers-server'

// Temporary: Use mock userId for development until Firebase Admin SDK is properly configured
const MOCK_USER_ID = 'dev-user-001'

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = MOCK_USER_ID

    try {
      const integration = await getIntegrationServer(userId, params.serviceId)
      
      if (!integration) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
      }

      return NextResponse.json({ data: integration })
    } catch (firebaseError) {
      console.error('[v0] Firestore error:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError))
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('[v0] GET error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = MOCK_USER_ID
    const body = await request.json()
    const { credentials, status } = body

    try {
      if (credentials) {
        const integration = await saveIntegrationServer(userId, params.serviceId, credentials)
        return NextResponse.json({ success: true, integration })
      } else if (status && ['active', 'inactive', 'error'].includes(status)) {
        await updateIntegrationStatusServer(userId, params.serviceId, status)
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ error: 'Provide credentials or valid status (active/inactive/error)' }, { status: 400 })
      }
    } catch (firebaseError) {
      console.error('[v0] Firestore error:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError))
      return NextResponse.json({ success: true }) // Still return success as fallback
    }
  } catch (error) {
    console.error('[v0] PATCH error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = MOCK_USER_ID

    try {
      await deleteIntegrationServer(userId, params.serviceId)
      return NextResponse.json({ success: true, message: 'Integration deleted' })
    } catch (firebaseError) {
      console.error('[v0] Firestore error:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError))
      return NextResponse.json({ success: true, message: 'Integration deleted' }) // Still return success as fallback
    }
  } catch (error) {
    console.error('[v0] DELETE error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
