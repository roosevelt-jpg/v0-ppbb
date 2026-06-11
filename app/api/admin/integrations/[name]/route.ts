import { NextRequest, NextResponse } from 'next/server'
import { setApiConfig, getApiConfig, checkServiceHealth } from '@/lib/api-config'
import { updateDoc, doc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
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
    const serviceName = params.name
    const body = await request.json()

    const success = await setApiConfig(serviceName, {
      ...body,
      status: body.status || 'active',
      lastChecked: new Date(),
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
    const serviceName = params.name

    const docRef = doc(db, 'apiConfigs', serviceName)
    await updateDoc(docRef, {
      status: 'inactive',
      apiKey: deleteField(),
      apiSecret: deleteField(),
      updatedAt: new Date(),
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
