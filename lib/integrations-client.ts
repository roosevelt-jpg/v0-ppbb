// Client-side utility to fetch integration settings
// This is safe to use client-side as it only retrieves non-sensitive display data

export async function getIntegrationConfig(integrationId: string) {
  try {
    const res = await fetch(`/api/admin/integrations/${integrationId}`)
    if (!res.ok) {
      console.warn(`[v0] Failed to fetch ${integrationId} config:`, res.status)
      return null
    }
    const data = await res.json()
    return data.data || null
  } catch (error) {
    console.error(`[v0] Error fetching ${integrationId}:`, error)
    return null
  }
}

export async function getGoogleMapsApiKey(): Promise<string | null> {
  try {
    const config = await getIntegrationConfig('googleMaps')
    return config?.apiKey || null
  } catch (error) {
    console.error('[v0] Error fetching Google Maps API key:', error)
    return null
  }
}
