import { NextRequest, NextResponse } from 'next/server'
import {
  getIntegrationServer,
  saveIntegrationServer,
  deleteIntegrationServer,
  updateIntegrationStatusServer,
} from '@/lib/integrations/handlers-server'
import {
  verifyIdToken,
  isAdminUser,
  hasInvitePermissionServer,
} from '@/lib/admin-access-server'

const MOCK_USER_ID = 'dev-user-001'

async function requireManageIntegrations(
  request: NextRequest
): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const uid = await verifyIdToken(token)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const isAdmin = await isAdminUser(uid)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const allowed = await hasInvitePermissionServer(uid, 'manage_integrations')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Forbidden: manage_integrations permission required' },
      { status: 403 }
    )
  }
  return { uid }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const authResult = await requireManageIntegrations(request)
    if (authResult instanceof NextResponse) return authResult

    const { serviceId } = await params
    const integration = await getIntegrationServer(MOCK_USER_ID, serviceId)

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json({ data: integration })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const authResult = await requireManageIntegrations(request)
    if (authResult instanceof NextResponse) return authResult

    const { serviceId } = await params
    const body = await request.json()
    const { credentials, status } = body

    if (credentials) {
      try {
        const integration = await saveIntegrationServer(MOCK_USER_ID, serviceId, credentials)
        return NextResponse.json({ success: true, integration })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('[v0] Save integration error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    if (status && ['active', 'inactive', 'error', 'pending'].includes(status)) {
      try {
        await updateIntegrationStatusServer(MOCK_USER_ID, serviceId, status)
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
    const authResult = await requireManageIntegrations(request)
    if (authResult instanceof NextResponse) return authResult

    const { serviceId } = await params

    try {
      await deleteIntegrationServer(MOCK_USER_ID, serviceId)
      return NextResponse.json({ success: true, message: 'Integration deleted' })
    } catch (error) {
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
