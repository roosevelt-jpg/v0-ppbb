import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await request.json()

    // Get calendar integration
    const integrationDoc = await getDoc(
      doc(db, 'users', user.uid, 'calendarIntegrations', 'microsoft')
    )

    if (!integrationDoc.exists()) {
      return NextResponse.json(
        { error: 'Microsoft Calendar not connected', action: 'connect' },
        { status: 400 }
      )
    }

    const integration = integrationDoc.data()
    let accessToken = integration.accessToken

    // Check if token is expired and refresh if needed
    if (integration.expiresAt.toDate() < new Date()) {
      const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: integration.refreshToken,
          client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          scope: 'Calendars.ReadWrite offline_access',
        }).toString(),
      })

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json()
        accessToken = newTokens.access_token
        // Update stored token
        await setDoc(
          doc(db, 'users', user.uid, 'calendarIntegrations', 'microsoft'),
          {
            ...integration,
            accessToken: newTokens.access_token,
            updatedAt: Timestamp.now(),
          }
        )
      }
    }

    // Fetch event details
    const eventDoc = await getDoc(doc(db, 'events', eventId))
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

    // Create Microsoft Calendar event
    const calendarEvent = {
      subject: event.title,
      bodyPreview: event.description,
      body: {
        contentType: 'HTML',
        content: event.description,
      },
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
      location: {
        displayName: `${event.location.address}, ${event.location.city}`,
      },
      isReminderOn: true,
      reminderMinutesBeforeStart: 15,
    }

    const microsoftResponse = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    })

    if (!microsoftResponse.ok) {
      console.error('[v0] Failed to create Microsoft Calendar event:', await microsoftResponse.text())
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      )
    }

    const microsoftEvent = await microsoftResponse.json()

    return NextResponse.json({
      success: true,
      calendarEventId: microsoftEvent.id,
      message: 'Event added to Microsoft Calendar',
    })
  } catch (error) {
    console.error('[v0] Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}
