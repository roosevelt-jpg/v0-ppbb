import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { getAuthUidFromRequest, promoteNextWaitlisted } from '@/lib/event-luma-server'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const { id: eventId } = await context.params
    const authUid = await getAuthUidFromRequest(request)
    const userId = authUid || request.nextUrl.searchParams.get('userId')
    const db = getAdminDb()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const regSnapshot = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get()

    if (regSnapshot.empty) {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 })
    }

    const regDoc = regSnapshot.docs[0]
    const registration = regDoc.data()

    await regDoc.ref.update({
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      cancellationReason: 'User cancelled',
    })

    if (registration.status === 'confirmed') {
      await db.collection('events').doc(eventId).update({
        currentAttendees: FieldValue.increment(-1),
        updatedAt: Timestamp.now(),
      })
      void promoteNextWaitlisted(eventId).catch(console.error)
    } else if (registration.status === 'waitlisted') {
      await db.collection('events').doc(eventId).update({
        waitlistCount: FieldValue.increment(-1),
        updatedAt: Timestamp.now(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error canceling registration:', error)
    return NextResponse.json({ success: false, error: 'Cancellation failed' }, { status: 500 })
  }
}
