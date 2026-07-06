import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const userId = request.nextUrl.searchParams.get('userId')
    const db = getAdminDb()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }

    // Find and delete registration
    const regSnapshot = await db.collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get()

    if (regSnapshot.empty) {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 })
    }

    const regDoc = regSnapshot.docs[0]
    const registration = regDoc.data() as any

    // Get current event data
    const eventDoc = await db.collection('events').doc(eventId).get()
    const event = eventDoc.data() as any

    // Delete registration
    await regDoc.ref.delete()

    // Update event attendee count
    await db.collection('events').doc(eventId).update({
      currentAttendees: Math.max(0, (event.currentAttendees || 0) - 1),
      totalRevenue: Math.max(0, (event.totalRevenue || 0) - (registration.amountPaid || 0)),
      pbRevenue: Math.max(0, (event.pbRevenue || 0) - (registration.pbCut || 0)),
      businessRevenue: Math.max(0, (event.businessRevenue || 0) - (registration.businessCut || 0)),
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error canceling registration:', error)
    return NextResponse.json({ success: false, error: 'Cancellation failed' }, { status: 500 })
  }
}
