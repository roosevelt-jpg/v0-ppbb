import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    const eventDoc = await getDoc(doc(db, 'events', eventId))
    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const eventData = eventDoc.data()
    return NextResponse.json({
      id: eventDoc.id,
      ...eventData,
    })
  } catch (error) {
    console.error('[v0] Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
