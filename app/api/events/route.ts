import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

function sortEventsByCreatedAt(events: Array<Record<string, unknown> & { id: string }>) {
  return events.sort((a, b) => {
    const aTime = new Date((a.createdAt as string) || 0).getTime()
    const bTime = new Date((b.createdAt as string) || 0).getTime()
    return bTime - aTime
  })
}

async function notifyEventCreator(
  createdBy: string,
  title: string,
  type: 'event_approved' | 'event_rejected' | 'event_changes_requested',
  message: string
) {
  if (!createdBy || createdBy === 'admin') return
  try {
    const db = getAdminDb()
    await db.collection('users').doc(createdBy).collection('notifications').add({
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
    })
  } catch (error) {
    console.warn('[v0] Could not notify event creator:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const createdBy = request.nextUrl.searchParams.get('createdBy')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10)
    const id = request.nextUrl.searchParams.get('id')

    const db = getAdminDb()

    if (id) {
      const snap = await db.collection('events').doc(id).get()
      if (!snap.exists) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: serializeFirestoreDoc(snap.id, snap.data() as Record<string, unknown>),
      })
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('events')

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy)
    }

    const snapshot = await query.limit(limit).get()
    const events = sortEventsByCreatedAt(
      snapshot.docs.map((doc) =>
        serializeFirestoreDoc(doc.id, doc.data() as Record<string, unknown>) as Record<string, unknown> & { id: string }
      )
    )

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('[v0] Events fetch error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch events'
    if (message.includes('index')) {
      console.error(
        '[v0] Firestore composite index may be required. Create it in Firebase Console → Firestore → Indexes:',
        message
      )
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = getAdminDb()

    const createdByRole = body.createdByRole || 'admin'
    if (createdByRole === 'member') {
      return NextResponse.json(
        { success: false, error: 'Members cannot create events' },
        { status: 403 }
      )
    }

    const locationName = body.locationName || body.location
    const startDate = body.startDate || body.date
    if (!body.title || !startDate || !locationName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, startDate, or locationName' },
        { status: 400 }
      )
    }

    let status = body.status || 'draft'
    const isBusiness = createdByRole === 'business'

    if (isBusiness) {
      if (status === 'published') {
        status = 'pending_approval'
      }
      if (status === 'submitted') {
        status = 'pending_approval'
      }
    }

    const isPublished = status === 'published'
    const isPending = status === 'pending_approval'

    const eventData = sanitizeForFirestore({
      title: body.title,
      description: body.description || '',
      category: body.category || 'general',
      tags: body.tags || [],
      genderRestriction: body.genderRestriction || 'mixed',
      isFeatured: body.isFeatured || false,

      speakers: body.speakers || [],
      agenda: body.agenda || [],

      locationName: body.locationName || body.location || '',
      locationAddress: body.locationAddress || body.locationName || body.location || '',
      locationPlaceId: body.locationPlaceId || body.locationData?.placeId || '',
      locationLat: body.locationLat ?? body.locationData?.lat ?? 0,
      locationLng: body.locationLng ?? body.locationData?.lng ?? 0,

      startDate: new Date(body.startDate || body.date),
      endDate: new Date(body.endDate || body.startDate || body.date),
      timezone: body.timezone || 'Asia/Dubai',

      pricingType: body.pricingType || (body.isPaid ? 'paid_by_pb' : 'free'),
      price: body.price ?? null,
      currency: body.currency || 'AED',
      revenueModel: body.revenueModel || (body.isPaid ? 'pb_full' : null),
      pbCommissionPercent: body.pbCommissionPercent || null,
      businessPayoutPercent: body.businessPayoutPercent || null,
      pbCommissionOverride: body.pbCommissionOverride || false,
      paymentGateway: body.paymentGateway || null,

      bannerURL: body.bannerURL || body.bannerImageUrl || body.bannerImage || '',
      maxAttendees: body.maxAttendees || null,
      currentAttendees: 0,

      totalRevenue: 0,
      pbRevenue: 0,
      businessRevenue: 0,
      payoutStatus: 'not_applicable',
      payoutReference: null,
      payoutDate: null,

      status,
      publishedAt: isPublished ? Timestamp.now() : null,
      cancelledAt: null,
      cancelReason: null,

      createdBy: body.createdBy || 'admin',
      createdByRole,
      submittedAt: isPending ? Timestamp.now() : null,
      approvedBy: isPublished && !isBusiness ? body.createdBy || 'admin' : null,
      approvedAt: isPublished && !isBusiness ? Timestamp.now() : null,
      approvalNotes: null,
      lastEditedBy: null,
      lastEditedAt: null,
      editHistory: [],

      calendarEventId: null,

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const docRef = await db.collection('events').add(eventData)

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...eventData },
    })
  } catch (error) {
    console.error('[v0] Event creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create event'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rawUpdates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Event ID required' }, { status: 400 })
    }

    const db = getAdminDb()
    const existingSnap = await db.collection('events').doc(id).get()
    if (!existingSnap.exists) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }
    const existing = existingSnap.data()!

    const updates: Record<string, unknown> = { ...rawUpdates }

    if (updates.status === 'published' && !updates.pbCommissionPercent) {
      try {
        const configDoc = await db.collection('platformConfig').doc('events').get()
        if (configDoc.exists) {
          const config = configDoc.data()
          updates.pbCommissionPercent = config?.pbCommissionPercent || 10
          updates.businessPayoutPercent = 100 - (updates.pbCommissionPercent as number || 10)
        }
      } catch {
        updates.pbCommissionPercent = 10
        updates.businessPayoutPercent = 90
      }
      updates.publishedAt = Timestamp.now()
    }

    if (updates.status === 'pending_approval' && !updates.submittedAt) {
      updates.submittedAt = Timestamp.now()
    }

    if (updates.status === 'published' && !updates.publishedAt) {
      updates.publishedAt = Timestamp.now()
      updates.approvedAt = Timestamp.now()
    }

    updates.updatedAt = Timestamp.now()
    if (updates.lastEditedAt) {
      updates.lastEditedAt = Timestamp.now()
    }

    const sanitized = sanitizeForFirestore(updates)
    await db.collection('events').doc(id).update(sanitized)

    const title = (existing.title as string) || 'Your event'
    const createdBy = (existing.createdBy as string) || ''

    if (updates.status === 'published' && existing.status === 'pending_approval') {
      await notifyEventCreator(
        createdBy,
        title,
        'event_approved',
        `Your event "${title}" has been approved and published.`
      )
    }
    if (updates.status === 'rejected') {
      await notifyEventCreator(
        createdBy,
        title,
        'event_rejected',
        updates.approvalNotes
          ? `Your event "${title}" was rejected: ${updates.approvalNotes}`
          : `Your event "${title}" was rejected.`
      )
    }
    if (updates.status === 'changes_requested') {
      await notifyEventCreator(
        createdBy,
        title,
        'event_changes_requested',
        updates.approvalNotes
          ? `Changes requested for "${title}": ${updates.approvalNotes}`
          : `Changes were requested for your event "${title}".`
      )
    }

    return NextResponse.json({ success: true, message: 'Event updated', data: { id, ...sanitized } })
  } catch (error) {
    console.error('[v0] Event update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Event ID required' }, { status: 400 })
    }

    const db = getAdminDb()
    await db.collection('events').doc(id).delete()

    return NextResponse.json({ success: true, message: 'Event deleted' })
  } catch (error) {
    console.error('[v0] Event delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 })
  }
}
