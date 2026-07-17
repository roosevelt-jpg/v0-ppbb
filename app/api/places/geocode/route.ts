import { NextRequest, NextResponse } from 'next/server'
import { listGooglePlacesApiKeyCandidates } from '@/lib/resolve-google-places-key'

export const dynamic = 'force-dynamic'

/**
 * Reverse-geocode lat/lng via Google Geocoding (server key).
 */
export async function GET(request: NextRequest) {
  try {
    const lat = Number(request.nextUrl.searchParams.get('lat'))
    const lng = Number(request.nextUrl.searchParams.get('lng'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ success: false, error: 'lat and lng are required' }, { status: 400 })
    }

    const apiKeys = await listGooglePlacesApiKeyCandidates()
    if (apiKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Google Maps API key is not configured' },
        { status: 503 }
      )
    }

    let lastError = 'Geocode failed'
    for (const apiKey of apiKeys) {
      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        key: apiKey,
      })
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
      )
      const data = await googleRes.json()

      if (data.status === 'OK' && data.results?.[0]) {
        const result = data.results[0]
        const components: Array<{ long_name: string; short_name: string; types: string[] }> =
          result.address_components || []
        const findType = (...types: string[]) =>
          components.find((c) => types.some((t) => c.types?.includes(t)))

        const locality = findType('locality', 'postal_town', 'sublocality')
        const admin1 = findType('administrative_area_level_1')
        const countryComp = findType('country')

        return NextResponse.json({
          success: true,
          place: {
            formattedAddress: result.formatted_address || '',
            lat,
            lng,
            city: locality?.long_name || '',
            state: admin1?.long_name || '',
            country: countryComp?.long_name || '',
            countryCode: countryComp?.short_name || '',
          },
        })
      }

      lastError = data.error_message || data.status || lastError
      if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') continue
      break
    }

    return NextResponse.json({ success: false, error: lastError }, { status: 502 })
  } catch (error) {
    console.error('[places/geocode]', error)
    return NextResponse.json({ success: false, error: 'Geocode failed' }, { status: 500 })
  }
}
