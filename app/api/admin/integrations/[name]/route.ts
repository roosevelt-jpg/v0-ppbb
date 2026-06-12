import { NextRequest, NextResponse } from 'next/server'
import { setApiConfig, getApiConfig, checkServiceHealth } from '@/lib/api-config'
import { hasPermission } from '@/lib/admin-access'
import { getAuth } from 'firebase-admin/auth'
import { updateDoc, doc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'

async function checkIntegrationPermission(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid

    const hasAccess = await hasPermission(userId, 'manage_integrations')
    return hasAccess ? userId : null
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const userId = await checkIntegrationPermission(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const serviceName = params.name
    const config = await getApiConfig(serviceName)

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('[v0] Error fetching integration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const userId = await checkIntegrationPermission(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const serviceName = params.name
    const body = await request.json()

    console.log('[v0] POST /api/admin/integrations/', serviceName, 'Body:', body)

    // Get service definition to know what fields to expect
    const { services } = await import('@/lib/integrations/services')
    const serviceDefinition = services.find((s: any) => s.id === serviceName)

    if (!serviceDefinition) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Validate that at least one credential field is provided
    const requiredFields = serviceDefinition.fields || []
    const hasAtLeastOneField = requiredFields.some((field: any) => body[field.name])

    if (requiredFields.length > 0 && !hasAtLeastOneField) {
      console.log('[v0] Validation failed: no required fields provided')
      return NextResponse.json(
        { error: `At least one of these fields is required: ${requiredFields.map((f: any) => f.name).join(', ')}` },
        { status: 400 }
      )
    }

    // Save the configuration
    const { setApiConfigServer } = await import('@/lib/api-config-server')
    const success = await setApiConfigServer(serviceName, {
      ...body,
      status: body.status || 'active',
      lastChecked: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })

    if (!success) {
      console.log('[v0] Failed to save configuration')
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 400 }
      )
    }

    console.log('[v0] Configuration saved successfully for', serviceName)
    return NextResponse.json({
      message: 'Configuration saved successfully',
      serviceName,
    })
  } catch (error) {
    console.error('[v0] Error saving integration:', error)
    return NextResponse.json(
      { error: 'Failed to save integration configuration' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const userId = await checkIntegrationPermission(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const serviceName = params.name

    // Get service definition to know what fields to delete
    const { services } = await import('@/lib/integrations/services')
    const serviceDefinition = services.find((s: any) => s.id === serviceName)

    if (!serviceDefinition) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Delete all credential fields for this service
    const { deleteApiConfigServer } = await import('@/lib/api-config-server')
    const success = await deleteApiConfigServer(serviceName)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 400 }
      )
    }

    console.log('[v0] Configuration deleted for', serviceName)
    return NextResponse.json({
      message: 'Integration configuration deleted',
    })
  } catch (error) {
    console.error('[v0] Error deleting integration:', error)
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}
