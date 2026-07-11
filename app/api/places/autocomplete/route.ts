import { NextRequest, NextResponse } from 'next/server'
import { listGooglePlacesApiKeyCandidates } from '@/lib/resolve-google-places-key'

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

    const apiKeys = await listGooglePlacesApiKeyCandidates()
    if (apiKeys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Google Maps API key is not configured. Add it under Admin → Integrations → Google Maps API.',
          predictions: [],
        },
        { status: 503 }
      )
    }

    const components = buildCountryComponents(request.nextUrl.searchParams.get('countries'))
    let lastError = 'Places autocomplete failed'

    for (const apiKey of apiKeys) {
      const params = new URLSearchParams({
        input,
        key: apiKey,
      })
      if (components) {
        params.set('components', components)
      }

      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
      )
      const data = await googleRes.json()

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        const predictions = (data.predictions || []).map((prediction: any) => ({
          placeId: prediction.place_id,
          mainText: prediction.structured_formatting?.main_text || prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text || '',
          description: prediction.description || '',
        }))

        return NextResponse.json({ success: true, predictions })
      }

      lastError = data.error_message || data.status || lastError

      // Try next candidate for key/billing/restriction failures
      if (
        data.status === 'REQUEST_DENIED' ||
        data.status === 'INVALID_REQUEST' ||
        data.status === 'OVER_QUERY_LIMIT'
      ) {
        continue
      }

      break
    }

    return NextResponse.json({
      success: false,
      error: lastError,
      predictions: [],
    })
  } catch (error) {
    console.error('[v0] Places autocomplete proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location suggestions', predictions: [] },
      { status: 500 }
    )
  }
}
