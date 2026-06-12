import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.MICROSOFT_CALENDAR_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/microsoft/callback`
    const tenantId = process.env.MICROSOFT_CALENDAR_TENANT_ID || 'common'

    const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`)
    authUrl.searchParams.append('client_id', clientId!)
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', 'Calendars.ReadWrite offline_access')
    authUrl.searchParams.append('response_mode', 'query')

    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error('[v0] Error generating auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}
