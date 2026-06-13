import { NextRequest, NextResponse } from 'next/server'
import { saveIntegration, getAllIntegrations } from '@/lib/integrations/handlers'

export async function GET(request: NextRequest) {
  try {
    // For now, return empty integrations list
    // Auth is handled on client side
    return NextResponse.json({
      data: [],
      message: 'Integrations API'
    })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, credentials } = body

    console.log('[v0] POST: Saving integration', serviceId)

    if (!serviceId || !credentials) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the userId from the Authorization header's JWT token
    // For now, use a test userId - in production this would come from verifyIdToken
    const userId = 'test-user-123' // TODO: Extract from Firebase ID token
    
    try {
      const integration = await saveIntegration(userId, serviceId, credentials)
      console.log('[v0] Integration saved successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Integration saved',
        integration
      })
    } catch (dbError) {
      console.error('[v0] Database save error:', dbError)
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
