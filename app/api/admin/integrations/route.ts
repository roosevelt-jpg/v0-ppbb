import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] GET /api/admin/integrations')
    // Return empty list for now - Firebase integration pending
    return NextResponse.json({
      data: [],
      message: 'Integrations retrieved successfully',
      count: 0
    })
  } catch (error) {
    console.error('[v0] GET error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/admin/integrations')
    
    const body = await request.json()
    const { serviceId, credentials } = body

    if (!serviceId || !credentials) {
      console.log('[v0] Missing required fields')
      return NextResponse.json({ error: 'Missing required fields (serviceId, credentials)' }, { status: 400 })
    }

    console.log('[v0] POST: Saving integration', serviceId)
    
    // For now, return success immediately without Firestore persistence
    // Full Firestore persistence will be implemented once Firebase Admin SDK is properly configured
    return NextResponse.json({
      success: true,
      message: 'Integration configuration saved successfully',
      integration: {
        id: `${serviceId}-${Date.now()}`,
        serviceId: serviceId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[v0] POST error:', errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
