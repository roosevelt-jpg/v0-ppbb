import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const db = getAdminDb()

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') // If not provided, fetch all
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')

    let query
    if (status) {
      // Fetch events with specific status
      query = db.collection('events').where('status', '==', status).orderBy('date', 'asc').limit(limit)
    } else {
      // Fetch all events regardless of status
      query = db.collection('events').orderBy('date', 'asc').limit(limit)
    }

    const snapshot = await query.get()
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || doc.data().date,
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
    const { 
      title, 
      description, 
      date, 
      startTime, 
      endTime, 
      location,
      locationData,
      bannerImageUrl,
      isPaid, 
      price, 
      maxAttendees, 
      genderRestriction,
      tags,
      currency,
      paymentGateway,
      status 
    } = body

    if (!title || !date || !location) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${!title ? 'Title, ' : ''}${!date ? 'Date, ' : ''}${!location ? 'Location' : ''}` 
      }, { status: 400 })
    }

    // Validate and parse date
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid date format. Please provide a valid date.' 
      }, { status: 400 })
    }

    // Sanitize locationData for Firestore (remove functions, non-serializable properties)
    let sanitizedLocationData = undefined
    if (locationData) {
      sanitizedLocationData = {
        address: locationData.mainText || locationData.address,
        secondaryText: locationData.secondaryText || '',
        placeId: locationData.placeId || '',
        lat: locationData.lat || 0,
        lng: locationData.lng || 0,
      }
    }

    // Build event data with proper defaults - no undefined values for Firestore
    const maxAttendeesValue = maxAttendees ? parseInt(maxAttendees.toString()) : 100
    const eventData = {
      title,
      description,
      date: parsedDate,
      startTime,
      endTime,
      location,
      ...(sanitizedLocationData && { locationData: sanitizedLocationData }), // Only include if exists
      bannerImage: bannerImageUrl || '', // Firebase Storage URL (no base64)
      genderRestriction: genderRestriction || 'mixed',
      tags: tags || [], // Event tags array
      isPaid,
      price: isPaid ? price : 0,
      currency: currency || 'AED',
      paymentGateway: isPaid ? (paymentGateway || 'stripe') : '', // Empty if not paid
      maxAttendees: maxAttendeesValue,
      status: status || 'draft',
      attendees: [],
      registered: 0,
      capacity: maxAttendeesValue,
      eventType: 'community',
      category: 'event',
      organizerId: '', // Will be set by client if needed
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('[v0] Creating event with data:', JSON.stringify({
      title,
      date: parsedDate.toISOString(),
      location,
      locationData,
      status,
    }, null, 2))

    const docRef = await db.collection('events').add(eventData)

    console.log('[v0] Event created successfully with ID:', docRef.id)
    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...eventData },
    })
  } catch (error) {
    console.error('[v0] Event creation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : '',
      errorFull: error,
    })
    const errorMessage = error instanceof Error ? error.message : 'Failed to create event'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing event ID' }, { status: 400 })
    }

    updateData.updatedAt = new Date()
    if (updateData.date) updateData.date = new Date(updateData.date)

    await db.collection('events').doc(id).update(updateData)

    return NextResponse.json({ success: true, message: 'Event updated' })
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
      return NextResponse.json({ success: false, error: 'Missing event ID' }, { status: 400 })
    }

    await db.collection('events').doc(id).delete()

    return NextResponse.json({ success: true, message: 'Event deleted' })
  } catch (error) {
    console.error('[v0] Event delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 })
  }
}
