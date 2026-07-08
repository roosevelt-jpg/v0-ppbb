import { getAdminDb } from '@/lib/firebase-admin'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'

const DEFAULT_INTEGRATION_USER_ID = 'dev-user-001'

export async function resolveGooglePlacesApiKey(): Promise<string | null> {
  const envKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (envKey) {
    return envKey
  }

  try {
    const db = getAdminDb()
    const locationSnap = await db.collection('admin').doc('locationConfig').get()
    const locationData = locationSnap.data()
    if (typeof locationData?.googlePlacesApiKey === 'string' && locationData.googlePlacesApiKey) {
      return locationData.googlePlacesApiKey
    }
    if (typeof locationData?.googleMapsApiKey === 'string' && locationData.googleMapsApiKey) {
      return locationData.googleMapsApiKey
    }
  } catch (error) {
    console.warn('[v0] Could not load location config for Places API key:', error)
  }

  try {
    const integration = await getIntegrationServer(DEFAULT_INTEGRATION_USER_ID, 'googleMaps')
    const apiKey = integration?.credentials?.apiKey
    if (typeof apiKey === 'string' && apiKey) {
      return apiKey
    }
  } catch (error) {
    console.warn('[v0] Could not load integrations for Places API key:', error)
  }

  return null
}
