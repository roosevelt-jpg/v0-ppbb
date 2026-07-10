import { NextRequest, NextResponse } from 'next/server'
import {
  getIntegrationServer,
  saveIntegrationServer,
  deleteIntegrationServer,
  updateIntegrationStatusServer,
} from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import { requireIntegrationsAccess } from '@/lib/integrations/require-vault-access'
import { auditAdminApiAction } from '@/lib/audit-api-helper'

const MOCK_USER_ID = INTEGRATION_OWNER_USER_ID

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const authResult = await requireIntegrationsAccess(request)
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const authResult = await requireIntegrationsAccess(request)
    if (authResult instanceof NextResponse) return authResult

    const { serviceId } = await params
    const body = await request.json()
    const { credentials, status } = body

    if (credentials) {
      try {
        const integration = await saveIntegrationServer(MOCK_USER_ID, serviceId, credentials)
        await auditAdminApiAction(request, authResult.uid, {
          actionType: 'update',
          action: `Updated integration credentials: ${serviceId}`,
          entityType: 'integration',
          entityId: serviceId,
          entityName: serviceId,
          status: 'success',
        })
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
        await auditAdminApiAction(request, authResult.uid, {
          actionType: 'update',
          action: `Set integration status to ${status}: ${serviceId}`,
          entityType: 'integration',
          entityId: serviceId,
          entityName: serviceId,
          status: 'success',
        })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const authResult = await requireIntegrationsAccess(request)
    if (authResult instanceof NextResponse) return authResult

    const { serviceId } = await params

    try {
      await deleteIntegrationServer(MOCK_USER_ID, serviceId)
      await auditAdminApiAction(request, authResult.uid, {
        actionType: 'delete',
        action: `Deleted integration: ${serviceId}`,
        entityType: 'integration',
        entityId: serviceId,
        entityName: serviceId,
        status: 'success',
      })
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
