import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

export interface LocationConfig {
  googleMapsApiKey: string
  googlePlacesApiKey: string
  enableAutoDetect: boolean
  autoDetectRadius: number
  defaultCountry: string
}

export async function getLocationConfig(): Promise<LocationConfig | null> {
  try {
    const docRef = doc(db, 'admin', 'locationConfig')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as LocationConfig
    }
    return null
  } catch (error) {
    console.error('[v0] Error loading location config:', error)
    return null
  }
}

export async function getUserLocation(): Promise<{
  latitude: number
  longitude: number
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        resolve(null)
      }
    )
  })
}

export async function getLocationFromCoordinates(
  latitude: number,
  longitude: number,
  googleMapsApiKey: string
): Promise<any> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsApiKey}`
    )
    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      const components = result.address_components

      return {
        country: getComponent(components, 'country'),
        state: getComponent(components, 'administrative_area_level_1'),
        city: getComponent(components, 'locality') || getComponent(components, 'administrative_area_level_2'),
        formattedAddress: result.formatted_address,
      }
    }
    return null
  } catch (error) {
    console.error('[v0] Error getting location from coordinates:', error)
    return null
  }
}

export async function getCountries(): Promise<any[]> {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
    const data = await response.json()
    return data.sort((a: any, b: any) => a.name.common.localeCompare(b.name.common))
  } catch (error) {
    console.error('[v0] Error fetching countries:', error)
    return []
  }
}

export async function getStates(
  countryCode: string,
  cscApiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.countrystatecity.in/v1/countries/${countryCode}/states`,
      {
        headers: {
          'X-CSCAPI-KEY': cscApiKey,
        },
      }
    )
    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching states:', error)
    return []
  }
}

export async function getCities(
  countryCode: string,
  stateName: string,
  cscApiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.countrystatecity.in/v1/countries/${countryCode}/states/${stateName}/cities`,
      {
        headers: {
          'X-CSCAPI-KEY': cscApiKey,
        },
      }
    )
    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching cities:', error)
    return []
  }
}

function getComponent(components: any[], type: string): string {
  const component = components.find((c) => c.types.includes(type))
  return component?.long_name || ''
}
