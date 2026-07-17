import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { canManageEvent, getAuthUidFromRequest } from '@/lib/event-luma-server'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: Ctx) {
  const { id: eventId } = await context.params
  const uid = await getAuthUidFromRequest(request)
  if (!uid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const eventDoc = await getAdminDb().collection('events').doc(eventId).get()
  if (!eventDoc.exists) {
    return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
  }
  if (!(await canManageEvent(uid, eventDoc.data()!))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const code = String(body.code || body.qrToken || body.checkInCode || '').trim()
  if (!code) {
    return NextResponse.json({ success: false, error: 'Check-in code required' }, { status: 400 })
  }

  const db = getAdminDb()
  let snap = await db
    .collection('eventRegistrations')
    .where('eventId', '==', eventId)
    .where('qrToken', '==', code)
    .limit(1)
    .get()

  if (snap.empty) {
    snap = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('checkInCode', '==', code.toUpperCase())
      .limit(1)
      .get()
  }

  if (snap.empty && body.email) {
    snap = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userEmail', '==', String(body.email).trim().toLowerCase())
      .limit(1)
      .get()
  }

  if (snap.empty) {
    return NextResponse.json({ success: false, error: 'Guest not found' }, { status: 404 })
  }

  const doc = snap.docs[0]
  const data = doc.data()
  if (data.status !== 'confirmed') {
    return NextResponse.json(
      { success: false, error: `Cannot check in guest with status: ${data.status}` },
      { status: 400 }
    )
  }
  if (data.checkedInAt) {
    return NextResponse.json({
      success: true,
      alreadyCheckedIn: true,
      data: { id: doc.id, ...data },
    })
  }

  await doc.ref.update({ checkedInAt: Timestamp.now(), checkedInBy: uid })

  // Charity / volunteer events: credit hours toward certificates on first check-in
  try {
    const event = eventDoc.data() || {}
    const category = String(event.category || '').toLowerCase()
    const tags = Array.isArray(event.tags)
      ? event.tags.map((t: unknown) => String(t).toLowerCase())
      : []
    const isCharityVolunteer =
      category === 'charity' ||
      category.includes('charity') ||
      tags.includes('charity') ||
      tags.includes('fundraiser') ||
      tags.includes('volunteer')

    const guestUserId = typeof data.userId === 'string' ? data.userId : ''
    if (isCharityVolunteer && guestUserId) {
      const start = event.startDate?.toDate?.()
        ? event.startDate.toDate()
        : event.startDate
          ? new Date(event.startDate)
          : null
      const end = event.endDate?.toDate?.()
        ? event.endDate.toDate()
        : event.endDate
          ? new Date(event.endDate)
          : null
      let hours = 2
      if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        if (diff > 0 && diff <= 24) hours = Math.round(diff * 4) / 4
      }

      const existing = await db
        .collection('volunteerRecords')
        .where('userId', '==', guestUserId)
        .where('registrationId', '==', doc.id)
        .limit(1)
        .get()

      if (existing.empty) {
        const { FieldValue } = await import('firebase-admin/firestore')
        await db.collection('volunteerRecords').add({
          userId: guestUserId,
          eventId,
          eventTitle: String(event.title || 'Charity event'),
          registrationId: doc.id,
          hours,
          date: Timestamp.now(),
          description: `Checked in at ${String(event.title || 'event')}`,
          verified: true,
          source: 'event_check_in',
          createdAt: Timestamp.now(),
        })
        await db
          .collection('users')
          .doc(guestUserId)
          .set(
            {
              volunteeredHours: FieldValue.increment(hours),
              volunteerHours: FieldValue.increment(hours),
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          )
        const { evaluateCertificateMilestonesForUser } = await import(
          '@/lib/certificate-milestones-server'
        )
        void evaluateCertificateMilestonesForUser(guestUserId).catch((err) =>
          console.error('[check-in] certificate milestones:', err)
        )
      }
    }
  } catch (err) {
    console.error('[check-in] volunteer hours credit failed:', err)
  }

  return NextResponse.json({
    success: true,
    data: {
      id: doc.id,
      userName: data.userName,
      userEmail: data.userEmail,
      ticketTypeName: data.ticketTypeName,
      checkInCode: data.checkInCode,
    },
  })
}
