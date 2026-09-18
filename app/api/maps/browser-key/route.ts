import { NextResponse } from 'next/server'
import { resolveGooglePlacesApiKey } from '@/lib/resolve-google-places-key'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public browser Maps JS key for client map pins / Places UI.
 * Resolves Admin → Integrations → Google Maps, then locationConfig, then env.
 */
export async function GET() {
  try {
    const apiKey = await resolveGooglePlacesApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Google Maps API key is not configured in Integrations' },
        { status: 503 }
      )
    }
    return NextResponse.json({ success: true, apiKey })
  } catch (error) {
    console.error('[maps/browser-key]', error)
    return NextResponse.json({ success: false, error: 'Failed to resolve Maps key' }, { status: 500 })
  }
}
