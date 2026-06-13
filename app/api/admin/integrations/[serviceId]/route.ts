import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    // Return not found for now - Firebase integration pending
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  } catch (error) {
    console.error('[v0] GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const body = await request.json()
    const { credentials, status } = body

    if (credentials) {
      return NextResponse.json({ success: true, integration: { serviceId: params.serviceId } })
    } else if (status && ['active', 'inactive', 'error'].includes(status)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Provide credentials or valid status (active/inactive/error)' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] PATCH error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    return NextResponse.json({ success: true, message: 'Integration deleted' })
  } catch (error) {
    console.error('[v0] DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
