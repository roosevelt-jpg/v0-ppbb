import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { initializeAdminSDK } from '@/lib/firebase-admin'

initializeAdminSDK()
const db = admin.firestore()

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }

    // Find and delete registration
    const regSnapshot = await db.collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get()

    if (regSnapshot.empty) {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 })
    }

    const regDoc = regSnapshot.docs[0]
    const registration = regDoc.data() as any

    // Delete registration
    await regDoc.ref.delete()

    // Update event attendee count
    await db.collection('events').doc(eventId).update({
      currentAttendees: admin.firestore.FieldValue.increment(-1),
      totalRevenue: admin.firestore.FieldValue.increment(-(registration.amountPaid || 0)),
      pbCommissionAmount: admin.firestore.FieldValue.increment(-(registration.pbCut || 0)),
      businessPayoutAmount: admin.firestore.FieldValue.increment(-(registration.businessCut || 0)),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error canceling registration:', error)
    return NextResponse.json({ success: false, error: 'Cancellation failed' }, { status: 500 })
  }
}
