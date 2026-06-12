import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/events?error=no_code`
      )
    }

    const clientId = process.env.MICROSOFT_CALENDAR_CLIENT_ID
    const clientSecret = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/microsoft/callback`

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'Calendars.ReadWrite offline_access',
      }).toString(),
    })

    if (!tokenResponse.ok) {
      console.error('[v0] Failed to exchange code:', await tokenResponse.text())
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/events?error=auth_failed`
      )
    }

    const tokens = await tokenResponse.json()
    const user = auth.currentUser

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login`)
    }

    // Store calendar integration in Firestore
    await setDoc(
      doc(db, 'users', user.uid, 'calendarIntegrations', 'microsoft'),
      {
        provider: 'microsoft',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Timestamp.fromDate(new Date(Date.now() + tokens.expires_in * 1000)),
        updatedAt: Timestamp.now(),
      }
    )

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/events?calendar=connected`
    )
  } catch (error) {
    console.error('[v0] Microsoft Calendar OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/events?error=server_error`
    )
  }
}
