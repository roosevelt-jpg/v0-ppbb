import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  buildRegistrationRecord,
  canManageEvent,
  generateCheckInCode,
  generateQrToken,
  getAuthUidFromRequest,
  incrementTicketSold,
  promoteNextWaitlisted,
  registrationsToCsv,
  resolveTicketType,
} from '@/lib/event-luma-server'

type Ctx = { params: Promise<{ id: string }> }

async function loadManagedEvent(request: NextRequest, eventId: string) {
  const uid = await getAuthUidFromRequest(request)
  if (!uid) return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
  const doc = await getAdminDb().collection('events').doc(eventId).get()
  if (!doc.exists) return { error: NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }) }
  const event = doc.data()!
  if (!(await canManageEvent(uid, event))) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) }
  }
  return { uid, event, eventId }
}

export async function GET(request: NextRequest, context: Ctx) {
  const { id: eventId } = await context.params
  const managed = await loadManagedEvent(request, eventId)
  if ('error' in managed && managed.error) return managed.error

  const status = request.nextUrl.searchParams.get('status')
  const format = request.nextUrl.searchParams.get('format')
  let query: FirebaseFirestore.Query = getAdminDb()
    .collection('eventRegistrations')
    .where('eventId', '==', eventId)

  if (status && status !== 'all') {
    query = query.where('status', '==', status)
  }

  const snap = await query.get()
  const guests = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      registeredAt: data.registeredAt?.toDate?.()?.toISOString?.() || data.registeredAt,
      checkedInAt: data.checkedInAt?.toDate?.()?.toISOString?.() || data.checkedInAt || null,
    }
  })

  guests.sort((a: any, b: any) => {
    const at = new Date(a.registeredAt || 0).getTime()
    const bt = new Date(b.registeredAt || 0).getTime()
    return bt - at
  })

  if (format === 'csv') {
    const csv = registrationsToCsv(guests as any)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="event-${eventId}-guests.csv"`,
      },
    })
  }

  return NextResponse.json({ success: true, data: guests })
}

export async function POST(request: NextRequest, context: Ctx) {
  const { id: eventId } = await context.params
  const managed = await loadManagedEvent(request, eventId)
  if ('error' in managed && managed.error) return managed.error
  const { uid, event } = managed as { uid: string; event: Record<string, unknown> }

  const body = await request.json()
  const action = body.action as string

  if (action === 'add') {
    const ticket = resolveTicketType(event, body.ticketTypeId)
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Invalid ticket type' }, { status: 400 })
    }
    const email = String(body.userEmail || '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })
    }
    const registration = buildRegistrationRecord({
      eventId,
      userId: body.userId || `guest_${email}`,
      userName: body.userName || email,
      userEmail: email,
      userGender: body.userGender || '',
      status: 'confirmed',
      ticket,
      amountPaid: 0,
      paymentStatus: 'free',
      pbCut: 0,
      businessCut: 0,
      currency: ticket.currency,
      paymentGateway: null,
      inviteStatus: 'added',
      checkInCode: generateCheckInCode(),
      qrToken: generateQrToken(),
    })
    const ref = await getAdminDb().collection('eventRegistrations').add(registration)
    await getAdminDb()
      .collection('events')
      .doc(eventId)
      .update({ currentAttendees: FieldValue.increment(1), updatedAt: Timestamp.now() })
    if (ticket.id !== 'legacy') await incrementTicketSold(eventId, ticket.id)
    return NextResponse.json({ success: true, data: { id: ref.id, ...registration } })
  }

  if (action === 'approve' || action === 'reject' || action === 'checkin' || action === 'uncheckin') {
    const regId = body.registrationId as string
    if (!regId) {
      return NextResponse.json({ success: false, error: 'registrationId required' }, { status: 400 })
    }
    const ref = getAdminDb().collection('eventRegistrations').doc(regId)
    const doc = await ref.get()
    if (!doc.exists || doc.data()?.eventId !== eventId) {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 })
    }

    if (action === 'approve') {
      const code = generateCheckInCode()
      const token = generateQrToken()
      const data = doc.data()!
      await ref.update({
        status: 'confirmed',
        checkInCode: code,
        qrToken: token,
        paymentStatus: data.paymentStatus === 'pending' && (data.amountPaid || 0) > 0
          ? 'pending'
          : data.paymentStatus || 'free',
      })
      await getAdminDb()
        .collection('events')
        .doc(eventId)
        .update({ currentAttendees: FieldValue.increment(1), updatedAt: Timestamp.now() })

      const origin =
        request.headers.get('origin') ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://www.passive-blessings.com'
      if (data.userEmail) {
        const { sendEventRegistrationEmail } = await import('@/lib/event-confirmation-email')
        void sendEventRegistrationEmail({
          to: String(data.userEmail),
          eventTitle: String(event.title || 'Event'),
          eventUrl: `${origin}/events/${eventId}`,
          status: 'confirmed',
          checkInCode: code,
        })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      await ref.update({ status: 'rejected', cancelledAt: Timestamp.now() })
      if (doc.data()?.status === 'waitlisted') {
        await getAdminDb()
          .collection('events')
          .doc(eventId)
          .update({ waitlistCount: FieldValue.increment(-1), updatedAt: Timestamp.now() })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'checkin') {
      await ref.update({ checkedInAt: Timestamp.now(), checkedInBy: uid })
      return NextResponse.json({ success: true })
    }

    if (action === 'uncheckin') {
      await ref.update({ checkedInAt: null, checkedInBy: null })
      return NextResponse.json({ success: true })
    }
  }

  if (action === 'promote_waitlist') {
    const promoted = await promoteNextWaitlisted(eventId)
    return NextResponse.json({ success: true, registrationId: promoted })
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}
