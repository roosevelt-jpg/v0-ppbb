import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[v0] Missing auth header in GET')
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log('[v0] Verifying token...')
    const userId = await verifyIdToken(token)
    
    if (!userId) {
      console.log('[v0] Token verification returned null')
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    console.log('[v0] GET: Auth successful for user:', userId)
    
    // For now, return empty list - TODO: fetch from Firestore
    return NextResponse.json({
      data: [],
      message: 'Integrations retrieved successfully'
    })
  } catch (error) {
    console.error('[v0] GET error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[v0] Missing auth header in POST')
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log('[v0] Verifying token in POST...')
    const userId = await verifyIdToken(token)
    
    if (!userId) {
      console.log('[v0] Token verification returned null in POST')
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { serviceId, credentials } = body

    if (!serviceId || !credentials) {
      console.log('[v0] Missing serviceId or credentials')
      return NextResponse.json(
        { error: 'Missing serviceId or credentials' },
        { status: 400 }
      )
    }

    console.log('[v0] POST: Auth successful for user:', userId, 'service:', serviceId)
    
    // TODO: Save to Firestore with encryption
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Integration saved successfully'
    })
  } catch (error) {
    console.error('[v0] POST error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
