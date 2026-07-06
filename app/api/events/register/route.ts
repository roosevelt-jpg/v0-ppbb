import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, userId, registrationType, userName, userEmail, userGender } = body
    const db = getAdminDb()

    if (!eventId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Get event
    const eventDoc = await db.collection('events').doc(eventId).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }

    const event = eventDoc.data() as any
    const eventRef = db.collection('events').doc(eventId)

    // Check capacity
    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      return NextResponse.json({ success: false, error: 'Event is full' }, { status: 400 })
    }

    // Calculate payment splits
    const price = event.price || 0
    const pbPercent = event.pbCommissionPercent || 10
    const pbCut = (price * pbPercent) / 100
    const businessCut = price - pbCut

    // Create registration
    const registration = {
      eventId,
      userId,
      userName,
      userEmail,
      userGender,
      registeredAt: Timestamp.now(),
      status: 'confirmed',
      paymentStatus: registrationType === 'free' ? 'free' : 'pending',
      amountPaid: registrationType === 'free' ? 0 : price,
      pbCut,
      businessCut,
      currency: event.currency || 'AED',
      paymentGateway: event.paymentGateway,
      calendarSynced: false,
    }

    const regRef = await db.collection('eventRegistrations').add(registration)

    // Update event attendee count and revenue
    const increment = (value: number) => value

    await eventRef.update({
      currentAttendees: event.currentAttendees + 1,
      totalRevenue: event.totalRevenue + price,
      pbRevenue: (event.pbRevenue || 0) + pbCut,
      businessRevenue: (event.businessRevenue || 0) + businessCut,
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({
      success: true,
      registrationId: regRef.id,
      registration,
    })
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 })
  }
}
