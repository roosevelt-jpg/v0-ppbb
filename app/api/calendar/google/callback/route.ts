import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { resolveCalendarDateRange } from '@/lib/google-calendar'
import { getEventLocationLabel } from '@/lib/event-utils'

type OAuthState = {
  uid?: string
  eventId?: string
  returnTo?: string
}

function parseState(raw: string | null): OAuthState {
  if (!raw) return {}
  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded) as OAuthState
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    try {
      return JSON.parse(raw) as OAuthState
    } catch {
      return {}
    }
  }
}

async function insertGoogleEvent(
  accessToken: string,
  eventId: string
): Promise<string | null> {
  const db = getAdminDb()
  const eventDoc = await db.collection('events').doc(eventId).get()
  if (!eventDoc.exists) return null
  const event = eventDoc.data()!
  const { start, end } = resolveCalendarDateRange({
    ...event,
    id: eventDoc.id,
    startDate: event.startDate?.toDate?.() || event.startDate,
    endDate: event.endDate?.toDate?.() || event.endDate,
    date: event.date?.toDate?.() || event.date,
  })
  const location = getEventLocationLabel(event as never)

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description || '',
        location,
        start: { dateTime: start.toISOString(), timeZone: event.timezone || 'UTC' },
        end: { dateTime: end.toISOString(), timeZone: event.timezone || 'UTC' },
      }),
    }
  )
  if (!res.ok) {
    console.error('[calendar] post-connect insert failed:', await res.text())
    return null
  }
  const data = await res.json()
  return typeof data.htmlLink === 'string' ? data.htmlLink : null
}

export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = parseState(searchParams.get('state'))
    const returnTo =
      typeof state.returnTo === 'string' && state.returnTo.startsWith('/')
        ? state.returnTo
        : typeof state.returnTo === 'string' && state.returnTo.startsWith(base)
          ? state.returnTo
          : '/dashboard/events'

    if (!code) {
      return NextResponse.redirect(`${base}/dashboard/events?error=no_code`)
    }

    const uid = typeof state.uid === 'string' ? state.uid : ''
    if (!uid) {
      return NextResponse.redirect(`${base}/login?next=${encodeURIComponent(returnTo)}`)
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    const redirectUri = `${base}/api/calendar/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${base}/dashboard/events?error=not_configured`)
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenResponse.ok) {
      console.error('[calendar] Failed to exchange code:', await tokenResponse.text())
      return NextResponse.redirect(`${base}/dashboard/events?error=auth_failed`)
    }

    const tokens = await tokenResponse.json()
    const db = getAdminDb()

    await db
      .collection('users')
      .doc(uid)
      .collection('calendarIntegrations')
      .doc('google')
      .set(
        {
          provider: 'google',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          expiresAt: Timestamp.fromDate(
            new Date(Date.now() + (tokens.expires_in || 3600) * 1000)
          ),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

    let calendarLink: string | null = null
    if (typeof state.eventId === 'string' && state.eventId && tokens.access_token) {
      calendarLink = await insertGoogleEvent(tokens.access_token, state.eventId)
    }

    if (calendarLink) {
      return NextResponse.redirect(calendarLink)
    }

    const sep = returnTo.includes('?') ? '&' : '?'
    return NextResponse.redirect(`${returnTo.startsWith('http') ? returnTo : `${base}${returnTo}`}${sep}calendar=connected`)
  } catch (error) {
    console.error('[calendar] OAuth error:', error)
    return NextResponse.redirect(`${base}/dashboard/events?error=server_error`)
  }
}
