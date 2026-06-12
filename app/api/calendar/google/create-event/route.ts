import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, Timestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await request.json()

    // Get calendar integration
    const integrationDoc = await getDoc(
      doc(db, 'users', user.uid, 'calendarIntegrations', 'google')
    )

    if (!integrationDoc.exists()) {
      return NextResponse.json(
        { error: 'Google Calendar not connected', action: 'connect' },
        { status: 400 }
      )
    }

    const integration = integrationDoc.data()
    let accessToken = integration.accessToken

    // Check if token is expired and refresh if needed
    if (integration.expiresAt.toDate() < new Date()) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: integration.refreshToken,
          client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
          grant_type: 'refresh_token',
        }).toString(),
      })

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json()
        accessToken = newTokens.access_token
      }
    }

    // Fetch event details
    const { db: firebaseDb } = await import('@/lib/firebase')
    const { getDoc: fbGetDoc, doc: fbDoc } = await import('firebase/firestore')

    const eventDoc = await fbGetDoc(fbDoc(firebaseDb, 'events', eventId))
    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventDoc.data()
    const eventDate = event.date instanceof Date ? event.date : event.date?.toDate() || new Date()
    const startDateTime = new Date(eventDate)
    const [startHour, startMin] = event.startTime.split(':')
    startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0)

    const endDateTime = new Date(startDateTime)
    const [endHour, endMin] = event.endTime.split(':')
    endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0)

    // Create Google Calendar event
    const calendarEvent = {
      summary: event.title,
      description: event.description,
      location: `${event.location.address}, ${event.location.city}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
    }

    const googleResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    })

    if (!googleResponse.ok) {
      console.error('[v0] Failed to create Google Calendar event:', await googleResponse.text())
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      )
    }

    const googleEvent = await googleResponse.json()

    return NextResponse.json({
      success: true,
      calendarEventId: googleEvent.id,
      message: 'Event added to Google Calendar',
    })
  } catch (error) {
    console.error('[v0] Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}
