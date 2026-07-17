import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'Google Calendar is not configured' }, { status: 500 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/google/callback`
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    const state = request.nextUrl.searchParams.get('state')
    if (state) authUrl.searchParams.set('state', state)

    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error('[calendar] Error generating auth URL:', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
