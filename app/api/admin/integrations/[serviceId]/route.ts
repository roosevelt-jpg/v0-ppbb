import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    console.log('[v0] GET service:', params.serviceId)
    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const body = await request.json()
    console.log('[v0] PATCH service:', params.serviceId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] PATCH error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    console.log('[v0] DELETE service:', params.serviceId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
