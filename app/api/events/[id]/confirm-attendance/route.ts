import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { getAuthUidFromRequest } from '@/lib/event-luma-server'
import { creditVolunteerHoursForEventAttendance } from '@/lib/volunteer-hours-from-event'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Member self-service: confirm I attended this charity/volunteer event.
 * Credits volunteer hours toward certificates (same as staff check-in).
 */
export async function POST(request: NextRequest, context: Ctx) {
  const { id: eventId } = await context.params
  const uid = await getAuthUidFromRequest(request)
  if (!uid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminDb()
  const eventDoc = await db.collection('events').doc(eventId).get()
  if (!eventDoc.exists) {
    return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
  }
  const event = eventDoc.data() || {}

  const snap = await db
    .collection('eventRegistrations')
    .where('eventId', '==', eventId)
    .where('userId', '==', uid)
    .limit(5)
    .get()

  if (snap.empty) {
    return NextResponse.json(
      { success: false, error: 'You are not registered for this event' },
      { status: 400 }
    )
  }

  const doc =
    snap.docs.find((d) => d.data().status === 'confirmed') ||
    snap.docs.find((d) => d.data().status !== 'cancelled' && d.data().status !== 'rejected') ||
    snap.docs[0]

  const data = doc.data()
  if (data.status !== 'confirmed') {
    return NextResponse.json(
      {
        success: false,
        error: `Registration status is ${data.status}. Confirm your ticket first, then confirm attendance.`,
      },
      { status: 400 }
    )
  }

  const start = event.startDate?.toDate?.()
    ? event.startDate.toDate()
    : event.startDate
      ? new Date(event.startDate)
      : null
  if (start && !Number.isNaN(start.getTime())) {
    const earliest = start.getTime() - 2 * 60 * 60 * 1000
    if (Date.now() < earliest) {
      return NextResponse.json(
        { success: false, error: 'Attendance can be confirmed from 2 hours before the event starts.' },
        { status: 400 }
      )
    }
  }

  if (!data.checkedInAt) {
    await doc.ref.update({
      checkedInAt: Timestamp.now(),
      checkedInBy: uid,
      attendanceConfirmedByMember: true,
    })
  }

  const credit = await creditVolunteerHoursForEventAttendance({
    eventId,
    event,
    registrationId: doc.id,
    userId: uid,
  })

  return NextResponse.json({
    success: true,
    alreadyCheckedIn: Boolean(data.checkedInAt),
    hoursCredited: credit.credited ? credit.hours : 0,
    alreadyCredited: credit.reason === 'already_credited',
    notCharityEvent: credit.reason === 'not_charity_event',
    message: credit.credited
      ? `Attendance confirmed. ${credit.hours} volunteer hour(s) added toward your certificates.`
      : credit.reason === 'already_credited'
        ? 'Attendance already confirmed — hours were already added.'
        : credit.reason === 'not_charity_event'
          ? 'Attendance noted. Hours are only credited for charity / volunteer events.'
          : 'Attendance confirmed.',
  })
}
