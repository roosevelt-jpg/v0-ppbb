'use client'

export interface LocationData {
  latitude: number
  longitude: number
  city: string
  state: string
  country: string
  countryCode: string
  address: string
}

/**
 * Browser geolocation + server reverse-geocode (uses Location Config / Integrations keys).
 */
export async function getUserLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('[geolocation] not supported')
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `/api/places/geocode?lat=${latitude}&lng=${longitude}`
          )
          const data = await response.json()
          if (data.success && data.place) {
            resolve({
              latitude: data.place.lat ?? latitude,
              longitude: data.place.lng ?? longitude,
              city: data.place.city || '',
              state: data.place.state || '',
              country: data.place.country || '',
              countryCode: data.place.countryCode || '',
              address: data.place.formattedAddress || '',
            })
            return
          }
          resolve(null)
        } catch (error) {
          console.error('[geolocation] geocode error:', error)
          resolve(null)
        }
      },
      (error) => {
        console.error('[geolocation] error:', error.message)
        resolve(null)
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  })
}

/** Places search via server proxy */
export async function searchLocation(query: string): Promise<LocationData[]> {
  try {
    const params = new URLSearchParams({ input: query })
    const response = await fetch(`/api/places/autocomplete?${params.toString()}`)
    const data = await response.json()
    if (!data.success || !data.predictions?.length) return []

    const locations: LocationData[] = []
    for (const prediction of data.predictions.slice(0, 5)) {
      const detailsRes = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(prediction.placeId)}`
      )
      const details = await detailsRes.json()
      if (!details.success || !details.place) continue
      locations.push({
        latitude: details.place.lat || 0,
        longitude: details.place.lng || 0,
        city: details.place.city || '',
        state: details.place.state || '',
        country: details.place.country || '',
        countryCode: details.place.countryCode || '',
        address: details.place.formattedAddress || prediction.mainText || '',
      })
    }
    return locations
  } catch (error) {
    console.error('[geolocation] search error:', error)
    return []
  }
}
