import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = await verifyIdToken(token)
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('[v0] GET service:', params.serviceId, 'for user:', userId)
    
    // TODO: Fetch from Firestore
    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = await verifyIdToken(token)
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[v0] PATCH service:', params.serviceId, 'for user:', userId)
    
    // TODO: Update in Firestore
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] PATCH error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = await verifyIdToken(token)
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('[v0] DELETE service:', params.serviceId, 'for user:', userId)
    
    // TODO: Delete from Firestore
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    )
  }
}
