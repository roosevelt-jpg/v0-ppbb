import { NextRequest, NextResponse } from 'next/server'
import { resolveGooglePlacesApiKey } from '@/lib/resolve-google-places-key'

export const dynamic = 'force-dynamic'

function buildCountryComponents(countries: string | null): string | undefined {
  if (!countries) return undefined
  const codes = countries
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
  if (codes.length === 0) return undefined
  return codes.map((code) => `country:${code}`).join('|')
}

export async function GET(request: NextRequest) {
  try {
    const input = request.nextUrl.searchParams.get('input')?.trim()
    if (!input) {
      return NextResponse.json({ success: true, predictions: [] })
    }

    const apiKey = await resolveGooglePlacesApiKey()
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Places API key is not configured on the server.',
          predictions: [],
        },
        { status: 503 }
      )
    }

    const params = new URLSearchParams({
      input,
      key: apiKey,
    })

    const components = buildCountryComponents(request.nextUrl.searchParams.get('countries'))
    if (components) {
      params.set('components', components)
    }

    const googleRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    )
    const data = await googleRes.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json({
        success: false,
        error: data.error_message || data.status || 'Places autocomplete failed',
        predictions: [],
      })
    }

    const predictions = (data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || '',
      description: prediction.description || '',
    }))

    return NextResponse.json({ success: true, predictions })
  } catch (error) {
    console.error('[v0] Places autocomplete proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location suggestions', predictions: [] },
      { status: 500 }
    )
  }
}
