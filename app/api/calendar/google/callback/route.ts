import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.json({ error: 'No authorization code' }, { status: 400 })
    }

    // Verify state matches (should be stored in session)
    // For now, we'll accept it

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/google/callback`

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenResponse.ok) {
      console.error('[v0] Failed to exchange code:', await tokenResponse.text())
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/events?error=auth_failed`)
    }

    const tokens = await tokenResponse.json()
    const user = auth.currentUser

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login`)
    }

    // Store calendar integration in Firestore
    await setDoc(
      doc(db, 'users', user.uid, 'calendarIntegrations', 'google'),
      {
        provider: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Timestamp.fromDate(new Date(Date.now() + tokens.expires_in * 1000)),
        updatedAt: Timestamp.now(),
      }
    )

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/events?calendar=connected`)
  } catch (error) {
    console.error('[v0] Calendar OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/events?error=server_error`
    )
  }
}
