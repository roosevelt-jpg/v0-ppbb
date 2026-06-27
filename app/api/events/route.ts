import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const db = getAdminDb()

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || 'published'
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')

    let query = db.collection('events').where('status', '==', status).orderBy('date', 'asc').limit(limit)

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
    const { title, description, date, startTime, endTime, location, bannerImageUrl, isPaid, price, maxAttendees, genderRestriction, dressCode, logistics, status } = body

    if (!title || !date || !location) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const eventData = {
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      location,
      bannerImageUrl,
      isPaid,
      price: isPaid ? price : 0,
      maxAttendees,
      genderRestriction,
      dressCode,
      logistics,
      status: status || 'draft',
      attendees: [],
      createdBy: '', // Will be set by client if needed
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await db.collection('events').add(eventData)

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...eventData },
    })
  } catch (error) {
    console.error('[v0] Event creation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 500 })
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
