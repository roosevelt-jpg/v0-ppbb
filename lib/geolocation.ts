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
 * Get user's current location using browser Geolocation API
 * Returns coordinates and attempts to reverse-geocode to address
 */
export async function getUserLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('[v0] Geolocation not supported')
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Use Google Geocoding API to reverse-geocode coordinates to address
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          
          const response = await fetch(geocodeUrl)
          const data = await response.json()

          if (data.results && data.results.length > 0) {
            const result = data.results[0]
            const addressComponents = result.address_components

            let city = ''
            let state = ''
            let country = ''
            let countryCode = ''

            // Parse address components
            addressComponents.forEach((component: any) => {
              if (component.types.includes('locality')) city = component.long_name
              if (component.types.includes('administrative_area_level_1')) state = component.long_name
              if (component.types.includes('country')) {
                country = component.long_name
                countryCode = component.short_name
              }
            })

            resolve({
              latitude,
              longitude,
              city,
              state,
              country,
              countryCode,
              address: result.formatted_address,
            })
          } else {
            resolve(null)
          }
        } catch (error) {
          console.error('[v0] Geocoding error:', error)
          resolve(null)
        }
      },
      (error) => {
        console.error('[v0] Geolocation error:', error.message)
        resolve(null)
      }
    )
  })
}

/**
 * Search for location using Google Places API
 */
export async function searchLocation(query: string): Promise<LocationData[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (!data.predictions) return []

    // Get place details for each prediction
    const locations: LocationData[] = []

    for (const prediction of data.predictions.slice(0, 5)) {
      const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      
      const detailsResponse = await fetch(placeDetailsUrl)
      const detailsData = await detailsResponse.json()

      if (detailsData.result) {
        const result = detailsData.result
        const geometry = result.geometry
        const addressComponents = result.address_components

        let city = ''
        let state = ''
        let country = ''
        let countryCode = ''

        addressComponents.forEach((component: any) => {
          if (component.types.includes('locality')) city = component.long_name
          if (component.types.includes('administrative_area_level_1')) state = component.long_name
          if (component.types.includes('country')) {
            country = component.long_name
            countryCode = component.short_name
          }
        })

        locations.push({
          latitude: geometry.location.lat,
          longitude: geometry.location.lng,
          city,
          state,
          country,
          countryCode,
          address: result.formatted_address,
        })
      }
    }

    return locations
  } catch (error) {
    console.error('[v0] Location search error:', error)
    return []
  }
}
