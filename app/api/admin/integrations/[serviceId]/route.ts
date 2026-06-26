import { NextRequest, NextResponse } from 'next/server'
import { getIntegrationServer, saveIntegrationServer, deleteIntegrationServer, updateIntegrationStatusServer } from '@/lib/integrations/handlers-server'

// TODO: Replace MOCK_USER_ID with real auth token verification once Firebase
// Admin SDK is configured. The Authorization header is already being sent by
// the frontend (Bearer token) but is currently ignored here.
const MOCK_USER_ID = 'dev-user-001'

export async function GET(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const userId = MOCK_USER_ID
    const { serviceId } = await params

    const integration = await getIntegrationServer(userId, serviceId)

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json({ data: integration })
  } catch (error) {
    // Surface the real error message so it's visible in server logs and the
    // frontend can show something meaningful rather than a generic 404.
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const userId = MOCK_USER_ID
    const { serviceId } = await params
    const body = await request.json()
    const { credentials, status } = body

    if (credentials) {
      try {
        const integration = await saveIntegrationServer(userId, serviceId, credentials)
        return NextResponse.json({ success: true, integration })
      } catch (error) {
        // Previously this caught any Firestore/Firebase error and returned
        // { success: true } anyway, silently lying to the frontend.
        // Now we surface the real error so the modal can show it to the user.
        const message = error instanceof Error ? error.message : String(error)
        console.error('[v0] Save integration error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    if (status && ['active', 'inactive', 'error', 'pending'].includes(status)) {
      try {
        await updateIntegrationStatusServer(userId, serviceId, status)
        return NextResponse.json({ success: true })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('[v0] Update status error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    return NextResponse.json(
      { error: 'Provide credentials or a valid status (active/inactive/error/pending)' },
      { status: 400 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] PATCH error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const userId = MOCK_USER_ID
    const { serviceId } = await params

    try {
      await deleteIntegrationServer(userId, serviceId)
      return NextResponse.json({ success: true, message: 'Integration deleted' })
    } catch (error) {
      // Previously returned { success: true } even when delete failed.
      // Now surfaces the real error.
      const message = error instanceof Error ? error.message : String(error)
      console.error('[v0] Delete integration error:', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] DELETE error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
