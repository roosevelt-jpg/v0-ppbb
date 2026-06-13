import { NextRequest, NextResponse } from 'next/server'

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

    // Return success for now
    // TODO: Persist to database
    return NextResponse.json({
      success: true,
      message: 'Integration saved'
    })
  } catch (error) {
    console.error('[v0] POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
