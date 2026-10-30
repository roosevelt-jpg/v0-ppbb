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
    let volunteerHours = 0
    try {
      const { backfillVolunteerHoursForUser } = await import('@/lib/volunteer-hours-from-event')
      await backfillVolunteerHoursForUser(userId)
      const userSnap = await db.collection('users').doc(userId).get()
      volunteerHours = Number(userSnap.data()?.volunteeredHours ?? userSnap.data()?.volunteerHours ?? 0)
    } catch (err) {
      console.error('[user/events] volunteer hour backfill:', err)
    }

    const regsSnapshot = await db.collection('eventRegistrations').where('userId', '==', userId).get()

    const registrations = regsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      registeredAt: docSnap.data().registeredAt?.toDate?.() || docSnap.data().registeredAt,
      checkedInAt: docSnap.data().checkedInAt?.toDate?.() || docSnap.data().checkedInAt || null,
    }))

    // Get event details for each registration (include registration meta for attendance confirm)
    const events = await Promise.all(
      registrations.map(async (reg: {
        id: string
        eventId: string
        status?: string
        paymentStatus?: string
        ticketTypeId?: string
        ticketName?: string
        checkedInAt?: Date | string | null
        attendanceConfirmedByMember?: boolean
        checkInCode?: string | null
        qrToken?: string | null
      }) => {
        if (reg.status === 'cancelled' || reg.status === 'rejected') return null
        const eventDoc = await db.collection('events').doc(reg.eventId).get()
        if (eventDoc.exists) {
          return {
            id: eventDoc.id,
            ...eventDoc.data(),
            startDate: eventDoc.data()?.startDate?.toDate?.() || eventDoc.data()?.startDate,
            endDate: eventDoc.data()?.endDate?.toDate?.() || eventDoc.data()?.endDate,
            registrationId: reg.id,
            registrationStatus: reg.status || 'confirmed',
            paymentStatus: reg.paymentStatus || null,
            ticketTypeId: reg.ticketTypeId || null,
            ticketName: reg.ticketName || null,
            checkedInAt: reg.checkedInAt,
            attendanceConfirmedByMember: Boolean(reg.attendanceConfirmedByMember),
            checkInCode: reg.checkInCode || null,
            qrToken: reg.qrToken || null,
          }
        }
        return null
      })
    )

    return NextResponse.json({
      success: true,
      data: events.filter(Boolean),
      volunteerHours,
    })
  } catch (error) {
    console.error('[v0] Error fetching user events:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 })
  }
}
