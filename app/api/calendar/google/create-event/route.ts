import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { getEventEndDate, getEventLocationLabel, getEventStartDate } from '@/lib/event-utils'

export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await request.json()

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

    const eventDoc = await getDoc(doc(db, 'events', eventId))
    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventDoc.data()!
    const startDateTime = getEventStartDate(event as never)
    const endDateTime = getEventEndDate(event as never)
    if (!event.startDate && event.date && typeof event.startTime === 'string') {
      const [startHour, startMin] = String(event.startTime).split(':')
      startDateTime.setHours(parseInt(startHour || '0', 10), parseInt(startMin || '0', 10), 0)
      if (typeof event.endTime === 'string') {
        const [endHour, endMin] = String(event.endTime).split(':')
        endDateTime.setTime(startDateTime.getTime())
        endDateTime.setHours(parseInt(endHour || '0', 10), parseInt(endMin || '0', 10), 0)
      }
    }

    const location =
      getEventLocationLabel(event as never) ||
      (event.location
        ? `${event.location.address || ''}, ${event.location.city || ''}`.trim()
        : '')

    const calendarEvent = {
      summary: event.title,
      description: event.description,
      location,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
    }

    const googleResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      }
    )

    if (!googleResponse.ok) {
      console.error('[v0] Failed to create Google Calendar event:', await googleResponse.text())
      return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
    }

    const googleEvent = await googleResponse.json()

    return NextResponse.json({
      success: true,
      calendarEventId: googleEvent.id,
      message: 'Event added to Google Calendar',
    })
  } catch (error) {
    console.error('[v0] Error creating calendar event:', error)
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
  }
}
