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

    // Validate that at least some credentials are provided
    const hasCredentials = 
      body.apiKey || 
      body.projectId || 
      body.privateKey || 
      body.clientEmail ||
      body.apiSecret ||
      body.privateKeyId

    if (!hasCredentials) {
      return NextResponse.json(
        { error: 'At least one credential field is required' },
        { status: 400 }
      )
    }

    const success = await setApiConfig(serviceName, {
      ...body,
      status: body.status || 'active',
      lastChecked: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 400 }
      )
    }

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

    const docRef = doc(db, 'apiConfigs', serviceName)
    await updateDoc(docRef, {
      status: 'inactive',
      apiKey: deleteField(),
      apiSecret: deleteField(),
      updatedAt: new Date(),
      deletedBy: userId,
    })

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
