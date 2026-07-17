import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getEventLocationLabel } from '@/lib/event-utils'
import { resolveCalendarDateRange } from '@/lib/google-calendar'

async function requireUid(request: NextRequest): Promise<string | null> {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null
  return verifyIdToken(token)
}

export async function POST(request: NextRequest) {
  try {
    const uid = await requireUid(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized', action: 'login' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : ''
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    const db = getAdminDb()
    const integrationSnap = await db
      .collection('users')
      .doc(uid)
      .collection('calendarIntegrations')
      .doc('google')
      .get()

    if (!integrationSnap.exists) {
      return NextResponse.json(
        { error: 'Google Calendar not connected', action: 'connect' },
        { status: 400 }
      )
    }

    const integration = integrationSnap.data()!
    let accessToken = integration.accessToken as string

    const expiresAt =
      integration.expiresAt?.toDate?.() ||
      (integration.expiresAt instanceof Date ? integration.expiresAt : null)

    if (expiresAt && expiresAt < new Date() && integration.refreshToken) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: String(integration.refreshToken),
          client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
          grant_type: 'refresh_token',
        }).toString(),
      })

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json()
        accessToken = newTokens.access_token
        await integrationSnap.ref.set(
          {
            accessToken,
            expiresAt: Timestamp.fromDate(
              new Date(Date.now() + (newTokens.expires_in || 3600) * 1000)
            ),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }
    }

    const eventDoc = await db.collection('events').doc(eventId).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventDoc.data()!
    const { start: startDateTime, end: endDateTime } = resolveCalendarDateRange({
      ...event,
      id: eventDoc.id,
      startDate: event.startDate?.toDate?.() || event.startDate,
      endDate: event.endDate?.toDate?.() || event.endDate,
      date: event.date?.toDate?.() || event.date,
    })

    const location =
      getEventLocationLabel(event as never) ||
      (event.location && typeof event.location === 'object'
        ? `${event.location.address || ''}, ${event.location.city || ''}`.trim()
        : '')

    const calendarEvent = {
      summary: event.title,
      description: event.description || '',
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
      console.error('[calendar] Google create failed:', await googleResponse.text())
      return NextResponse.json(
        { error: 'Failed to create calendar event', action: 'fallback' },
        { status: 500 }
      )
    }

    const googleEvent = await googleResponse.json()

    return NextResponse.json({
      success: true,
      calendarEventId: googleEvent.id,
      htmlLink: googleEvent.htmlLink || null,
      message: 'Event added to Google Calendar',
    })
  } catch (error) {
    console.error('[calendar] Error creating calendar event:', error)
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
  }
}
