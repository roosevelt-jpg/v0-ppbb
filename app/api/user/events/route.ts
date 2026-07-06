import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const db = getAdminDb()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }

    // Get all registrations for this user
    const regsSnapshot = await db.collection('eventRegistrations').where('userId', '==', userId).get()

    const registrations = regsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      registeredAt: doc.data().registeredAt?.toDate?.() || doc.data().registeredAt,
    }))

    // Get event details for each registration
    const events = await Promise.all(
      registrations.map(async (reg: any) => {
        const eventDoc = await db.collection('events').doc(reg.eventId).get()
        if (eventDoc.exists) {
          return {
            id: eventDoc.id,
            ...eventDoc.data(),
            startDate: eventDoc.data()?.startDate?.toDate?.() || eventDoc.data()?.startDate,
            endDate: eventDoc.data()?.endDate?.toDate?.() || eventDoc.data()?.endDate,
          }
        }
        return null
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
