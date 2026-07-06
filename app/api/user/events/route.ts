import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { initializeAdminSDK } from '@/lib/firebase-admin'

initializeAdminSDK()
const db = admin.firestore()

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }

    // Get all registrations for this user
    const regsSnapshot = await db.collection('eventRegistrations').where('userId', '==', userId).get()

    const registrations = regsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Get event details for each registration
    const events = await Promise.all(
      registrations.map(async (reg) => {
        const eventDoc = await db.collection('events').doc(reg.eventId).get()
        return eventDoc.exists ? { id: eventDoc.id, ...eventDoc.data() } : null
      })
    )

    return NextResponse.json({
      success: true,
      data: events.filter(Boolean),
    })
  } catch (error) {
    console.error('[v0] Error fetching user events:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 })
  }
}
