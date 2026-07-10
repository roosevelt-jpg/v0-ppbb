import { NextRequest, NextResponse } from 'next/server'
import { saveIntegrationServer, getAllIntegrationsServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import { requireIntegrationsAccess } from '@/lib/integrations/require-vault-access'
import { auditAdminApiAction } from '@/lib/audit-api-helper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MOCK_USER_ID = INTEGRATION_OWNER_USER_ID

function safeJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (v === undefined) return null
      if (typeof v === 'bigint') return v.toString()
      if (v && typeof v === 'object' && typeof (v as { toDate?: () => Date }).toDate === 'function') {
        try {
          return (v as { toDate: () => Date }).toDate().toISOString()
        } catch {
          return null
        }
      }
      return v
    })
  ) as T
}

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] GET /api/admin/integrations')
    const authResult = await requireIntegrationsAccess(request)
    if (authResult instanceof NextResponse) return authResult

    let integrations: unknown[] = []
    let loadWarning = ''
    try {
      integrations = await getAllIntegrationsServer(MOCK_USER_ID)
    } catch (loadError) {
      loadWarning =
        loadError instanceof Error ? loadError.message : 'Failed to read integrations collection'
      console.error('[v0] getAllIntegrationsServer failed:', loadWarning)
      integrations = []
    }

    const data = safeJson(integrations)
    const list = Array.isArray(data) ? data : []
    return NextResponse.json({
      success: true,
      data: list,
      message: 'Integrations retrieved successfully',
      count: list.length,
      activeCount: list.filter((row: { status?: string; credentials?: Record<string, unknown> }) => {
        const creds = row?.credentials
        const hasCreds = !!creds && Object.keys(creds).length > 0
        return row?.status === 'active' || (hasCreds && row?.status !== 'error')
      }).length,
      ...(loadWarning ? { warning: loadWarning } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] GET error:', message)
    // Never blank the UI with a hard 500 if auth already passed — return empty
    // list so cards still render as Pending while ops investigate Firestore.
    return NextResponse.json(
      {
        success: true,
        data: [],
        count: 0,
        activeCount: 0,
        error: message || 'Failed to retrieve integrations',
        warning:
          'Credentials are stored in Firestore and were not deleted. Retry after deploy, or check server logs.',
      },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/admin/integrations')

    const authResult = await requireIntegrationsAccess(request)
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()
    const { serviceId, credentials } = body

    if (!serviceId || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields (serviceId, credentials)' },
        { status: 400 }
      )
    }

    console.log('[v0] POST: Saving integration', serviceId)

    const integration = await saveIntegrationServer(MOCK_USER_ID, serviceId, credentials)
    console.log('[v0] Integration saved successfully')

    await auditAdminApiAction(request, authResult.uid, {
      actionType: 'update',
      action: `Saved integration: ${serviceId}`,
      entityType: 'integration',
      entityId: serviceId,
      entityName: serviceId,
      status: 'success',
    })

    return NextResponse.json({
      success: true,
      message: 'Integration saved successfully',
      integration: safeJson({
        id: integration.id,
        serviceId: integration.serviceId,
        status: integration.status,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      }),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[v0] POST error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
