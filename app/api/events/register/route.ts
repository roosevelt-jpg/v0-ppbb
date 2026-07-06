import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { initializeAdminSDK } from '@/lib/firebase-admin'

initializeAdminSDK()
const db = admin.firestore()

export async function POST(request: NextRequest) {
  try {
    const { eventId, userId, registrationType } = await request.json()

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

    // Create registration
    const registration = {
      eventId,
      userId,
      registrationType,
      registeredAt: new Date().toISOString(),
      paymentStatus: registrationType === 'free' ? 'free' : 'pending',
      amountPaid: registrationType === 'free' ? 0 : event.price,
      pbCut: registrationType === 'free' ? 0 : (event.price * event.pbCommissionPercent) / 100,
      businessCut: registrationType === 'free' ? 0 : event.price - (event.price * event.pbCommissionPercent) / 100,
    }

    const regRef = await db.collection('eventRegistrations').add(registration)

    // Update event attendee count
    await eventRef.update({
      currentAttendees: admin.firestore.FieldValue.increment(1),
      totalRevenue: admin.firestore.FieldValue.increment(registration.amountPaid),
      pbCommissionAmount: admin.firestore.FieldValue.increment(registration.pbCut),
      businessPayoutAmount: admin.firestore.FieldValue.increment(registration.businessCut),
    })

    // For paid events, return checkout URL (Stripe integration)
    let checkoutUrl = ''
    if (registrationType === 'paid_by_business' || registrationType === 'paid_by_pb') {
      // TODO: Create Stripe checkout session
      checkoutUrl = `/checkout/${regRef.id}`
    }

    return NextResponse.json({
      success: true,
      registrationId: regRef.id,
      checkoutUrl,
    })
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 })
  }
}
