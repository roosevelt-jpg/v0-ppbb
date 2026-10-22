import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { isAdminUser } from '@/lib/admin-access-server'
import { getAuthUidFromRequest } from '@/lib/event-luma-server'
import { parseDoorScanToken } from '@/lib/event-check-in-link'
import { confirmDoorScan } from '@/lib/event-door-scan'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Admin phone-camera check-in. The QR opens /admin/scan?t=… and this confirms it. */
export async function POST(request: NextRequest) {
  const uid = await getAuthUidFromRequest(request)
  if (!uid || !(await isAdminUser(uid))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in required' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const token = parseDoorScanToken(String(body.code || body.token || ''))
  if (!token) {
    return NextResponse.json({ success: false, error: 'Scan a guest QR code' }, { status: 400 })
  }

  const db = getAdminDb()
  let snap = await db.collection('eventRegistrations').where('qrToken', '==', token).limit(1).get()
  if (snap.empty) {
    snap = await db
      .collection('eventRegistrations')
      .where('checkInCode', '==', token.toUpperCase())
      .limit(1)
      .get()
  }
  if (snap.empty) {
    return NextResponse.json(
      { success: false, error: 'No registration matches this QR code' },
      { status: 404 }
    )
  }

  try {
    const result = await confirmDoorScan({ registrationId: snap.docs[0].id, adminUid: uid })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Check-in failed'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
