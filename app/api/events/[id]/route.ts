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

    const payload = serializeFirestoreDoc(snap.id, data as Record<string, unknown>) as Record<
      string,
      unknown
    >

    // Backfill host branding when older events lack denormalized fields
    const needsHost =
      !payload.businessName &&
      !payload.ownerName &&
      typeof payload.createdBy === 'string' &&
      payload.createdBy
    if (needsHost) {
      try {
        const { resolveEventHostFromUserData } = await import('@/lib/event-host')
        const userSnap = await db.collection('users').doc(String(payload.createdBy)).get()
        const role =
          payload.createdByRole === 'admin' || payload.createdByRole === 'business'
            ? payload.createdByRole
            : String(userSnap.data()?.role || 'business')
        const host = resolveEventHostFromUserData(
          String(payload.createdBy),
          userSnap.exists ? (userSnap.data() as Record<string, unknown>) : undefined,
          role.includes('admin') ? 'admin' : 'business'
        )
        payload.businessName = host.businessName
        payload.ownerName = host.ownerName
        payload.businessLogoUrl = host.businessLogoUrl
        payload.businessId = host.businessId
      } catch {
        /* ignore host enrich failures */
      }
    }

    return NextResponse.json({
      success: true,
      data: payload,
    })
  } catch (error) {
    console.error('[v0] Error fetching event:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch event' }, { status: 500 })
  }
}
