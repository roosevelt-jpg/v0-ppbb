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
