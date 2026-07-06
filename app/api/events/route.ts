import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const createdBy = request.nextUrl.searchParams.get('createdBy')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')

    const db = getAdminDb()
    let query: any = db.collection('events')

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy)
    }

    query = query.orderBy('createdAt', 'desc').limit(limit)

    const snapshot = await query.get()
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate?.() || doc.data().startDate,
      endDate: doc.data().endDate?.toDate?.() || doc.data().endDate,
      submittedAt: doc.data().submittedAt?.toDate?.() || doc.data().submittedAt,
      publishedAt: doc.data().publishedAt?.toDate?.() || doc.data().publishedAt,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }))

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('[v0] Events fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = getAdminDb()

    // Validate required fields
    if (!body.title || !body.startDate || !body.locationName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, startDate, or locationName' },
        { status: 400 }
      )
    }

    const eventData = {
      title: body.title,
      description: body.description || '',
      category: body.category || 'general',
      tags: body.tags || [],
      genderRestriction: body.genderRestriction || 'mixed',
      isFeatured: body.isFeatured || false,

      speakers: body.speakers || [],
      agenda: body.agenda || [],

      locationName: body.locationName,
      locationAddress: body.locationAddress,
      locationPlaceId: body.locationPlaceId,
      locationLat: body.locationLat || 0,
      locationLng: body.locationLng || 0,

      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate || body.startDate),
      timezone: body.timezone || 'Asia/Dubai',

      pricingType: body.pricingType || 'free',
      price: body.price || null,
      currency: body.currency || 'AED',
      revenueModel: body.revenueModel || null,
      pbCommissionPercent: body.pbCommissionPercent || null,
      businessPayoutPercent: body.businessPayoutPercent || null,
      pbCommissionOverride: body.pbCommissionOverride || false,
      paymentGateway: body.paymentGateway || null,

      bannerURL: body.bannerURL || '',
      maxAttendees: body.maxAttendees || null,
      currentAttendees: 0,

      totalRevenue: 0,
      pbRevenue: 0,
      businessRevenue: 0,
      payoutStatus: 'not_applicable',
      payoutReference: null,
      payoutDate: null,

      status: body.status || 'draft',
      publishedAt: null,
      cancelledAt: null,
      cancelReason: null,

      createdBy: body.createdBy || 'admin',
      createdByRole: body.createdByRole || 'admin',
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      approvalNotes: null,
      lastEditedBy: null,
      lastEditedAt: null,
      editHistory: [],

      calendarEventId: null,

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()

    // If publishing and no commission set, snapshot from platformConfig
    if (updates.status === 'published' && !updates.pbCommissionPercent) {
      try {
        const configDoc = await db.collection('platformConfig').doc('events').get()
        if (configDoc.exists) {
          const config = configDoc.data()
          updates.pbCommissionPercent = config?.pbCommissionPercent || 10
          updates.businessPayoutPercent = 100 - (updates.pbCommissionPercent || 10)
        }
      } catch (configError) {
        console.warn('[v0] Could not fetch platformConfig, using defaults')
        updates.pbCommissionPercent = 10
        updates.businessPayoutPercent = 90
      }
      updates.publishedAt = Timestamp.now()
    }

    // If approving business submission
    if (updates.status === 'published' && !updates.publishedAt) {
      updates.publishedAt = Timestamp.now()
      updates.approvedAt = Timestamp.now()
    }

    updates.updatedAt = Timestamp.now()
    if (updates.lastEditedAt) {
      updates.lastEditedAt = Timestamp.now()
    }

    await db.collection('events').doc(id).update(updates)

    return NextResponse.json({ success: true, message: 'Event updated', data: { id, ...updates } })
  } catch (error) {
    console.error('[v0] Event update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    await db.collection('events').doc(id).delete()

    return NextResponse.json({ success: true, message: 'Event deleted' })
  } catch (error) {
    console.error('[v0] Event delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
