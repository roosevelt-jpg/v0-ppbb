import { getAdminDb } from '@/lib/firebase-admin'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

/** Google browser/server keys typically look like this. */
function looksLikeGoogleApiKey(value: string): boolean {
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(value)
}

/** AES vault values are `ivHex:cipherHex` — never send those to Google. */
function looksLikeEncryptedVaultValue(value: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]+$/i.test(value)
}

function pushKey(keys: string[], value: unknown) {
  if (typeof value !== 'string') return
  const trimmed = value.trim()
  if (!trimmed) return
  if (looksLikeEncryptedVaultValue(trimmed)) return
  if (keys.includes(trimmed)) return
  keys.push(trimmed)
}

/**
 * Ordered API key candidates for Places / Maps server calls.
 * Prefer Admin → Integrations → Google Maps (org vault), then Location Config, then env.
 */
export async function listGooglePlacesApiKeyCandidates(): Promise<string[]> {
  const keys: string[] = []

  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'googleMaps')
    pushKey(keys, integration?.credentials?.apiKey)
  } catch (error) {
    console.warn('[v0] Could not load integrations for Places API key:', error)
  }

  try {
    const db = getAdminDb()
    const locationSnap = await db.collection('admin').doc('locationConfig').get()
    const locationData = locationSnap.data()
    pushKey(keys, locationData?.googlePlacesApiKey)
    pushKey(keys, locationData?.googleMapsApiKey)
  } catch (error) {
    console.warn('[v0] Could not load location config for Places API key:', error)
  }

  pushKey(keys, process.env.GOOGLE_PLACES_API_KEY)
  pushKey(keys, process.env.GOOGLE_MAPS_API_KEY)
  pushKey(keys, process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY)
  pushKey(keys, process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  // Prefer clearly valid Google keys if any exist
  const valid = keys.filter(looksLikeGoogleApiKey)
  return valid.length > 0 ? valid : keys
}

export async function resolveGooglePlacesApiKey(): Promise<string | null> {
  const keys = await listGooglePlacesApiKeyCandidates()
  return keys[0] ?? null
}
