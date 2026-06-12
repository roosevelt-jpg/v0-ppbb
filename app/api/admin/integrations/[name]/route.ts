import { NextRequest, NextResponse } from 'next/server'
import { setApiConfig, getApiConfig, checkServiceHealth } from '@/lib/api-config'
import { hasPermission } from '@/lib/admin-access'
import { getAuth } from 'firebase-admin/auth'
import { updateDoc, doc, deleteField, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

async function checkIntegrationPermission(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[v0] No Bearer token in Authorization header')
      return null
    }

    const token = authHeader.substring(7)
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid
    console.log('[v0] Token verified for userId:', userId)

    const hasAccess = await hasPermission(userId, 'manage_integrations')
    console.log('[v0] Permission check for manage_integrations:', hasAccess, 'userId:', userId)
    
    if (!hasAccess) {
      console.log('[v0] User lacks manage_integrations permission. Checking admin status...')
      // Log what permissions the user has
      const adminRef = doc(db, 'adminUsers', userId)
      const adminSnap = await getDoc(adminRef)
      if (adminSnap.exists()) {
        console.log('[v0] Admin user data:', adminSnap.data())
      } else {
        console.log('[v0] User is not in adminUsers collection')
      }
    }
    
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
      console.log('[v0] POST request rejected: User not authorized for manage_integrations')
      return NextResponse.json(
        { error: 'Unauthorized - User does not have manage_integrations permission' },
        { status: 401 }
      )
    }

    console.log('[v0] POST request authorized for userId:', userId)
    const serviceName = params.name
    const body = await request.json()

    console.log('[v0] POST /api/admin/integrations/', serviceName, 'Body keys:', Object.keys(body))

    // Get service definition to know what fields to expect
    const { services } = await import('@/lib/integrations/services')
    const serviceDefinition = services.find((s: any) => s.id === serviceName)

    if (!serviceDefinition) {
      console.log('[v0] Service not found:', serviceName, 'Available services:', services.map((s: any) => s.id))
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Service definition found for', serviceName, 'with fields:', serviceDefinition.fields.map((f: any) => f.name))

    // Validate that at least one credential field is provided
    const requiredFields = serviceDefinition.fields || []
    const hasAtLeastOneField = requiredFields.some((field: any) => body[field.name])

    console.log('[v0] Required fields:', requiredFields.map((f: any) => f.name))
    console.log('[v0] Body keys:', Object.keys(body))
    console.log('[v0] Has at least one field:', hasAtLeastOneField)

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
