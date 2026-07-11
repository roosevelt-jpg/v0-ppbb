import { NextRequest, NextResponse } from 'next/server'
import { listGooglePlacesApiKeyCandidates } from '@/lib/resolve-google-places-key'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const placeId = request.nextUrl.searchParams.get('placeId')?.trim()
    if (!placeId) {
      return NextResponse.json({ success: false, error: 'placeId is required' }, { status: 400 })
    }

    const apiKeys = await listGooglePlacesApiKeyCandidates()
    if (apiKeys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Google Maps API key is not configured. Add it under Admin → Integrations → Google Maps API.',
        },
        { status: 503 }
      )
    }

    let lastError = 'Place details failed'

    for (const apiKey of apiKeys) {
      const params = new URLSearchParams({
        place_id: placeId,
        key: apiKey,
        fields: 'geometry,formatted_address,address_components',
      })

      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
      )
      const data = await googleRes.json()

      if (data.status === 'OK' && data.result) {
        const result = data.result
        const city = result.address_components?.find((component: any) =>
          component.types?.includes('locality')
        )?.long_name

        return NextResponse.json({
          success: true,
          place: {
            placeId,
            formattedAddress: result.formatted_address || '',
            lat: result.geometry?.location?.lat ?? 0,
            lng: result.geometry?.location?.lng ?? 0,
            city: city || '',
          },
        })
      }

      lastError = data.error_message || data.status || lastError
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
    })
  } catch (error) {
    console.error('[v0] Places details proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch place details' },
      { status: 500 }
    )
  }
}
