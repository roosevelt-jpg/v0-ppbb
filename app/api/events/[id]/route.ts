import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const publishedOnly = request.nextUrl.searchParams.get('publishedOnly') === 'true'

    const db = getAdminDb()
    const snap = await db.collection('events').doc(eventId).get()

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }

    const data = snap.data()!
    if (publishedOnly && data.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: serializeFirestoreDoc(snap.id, data as Record<string, unknown>),
    })
  } catch (error) {
    console.error('[v0] Error fetching event:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch event' }, { status: 500 })
  }
}
