const GOOGLE_MAPS_SCRIPT_SELECTOR = 'script[src*="maps.googleapis.com/maps/api/js"]'

let loadPromise: Promise<void> | null = null

function isGoogleMapsPlacesReady(): boolean {
  return typeof window !== 'undefined' && Boolean(window.google?.maps?.places)
}

function waitForExistingScript(script: HTMLScriptElement): Promise<void> {
  if (isGoogleMapsPlacesReady()) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const onLoad = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Failed to load Google Maps API script'))
    }
    const cleanup = () => {
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
    }

    script.addEventListener('load', onLoad)
    script.addEventListener('error', onError)
  })
}

async function resolveGoogleMapsApiKey(): Promise<string | null> {
  const envKey =
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (envKey) {
    return envKey
  }

  try {
    const res = await fetch('/api/admin/integrations/googleMaps')
    if (!res.ok) {
      return null
    }
    const data = await res.json()
    return data.data?.credentials?.apiKey || data.data?.apiKey || null
  } catch {
    return null
  }
}

export function loadGoogleMapsPlacesApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser'))
  }

  if (isGoogleMapsPlacesReady()) {
    return Promise.resolve()
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      GOOGLE_MAPS_SCRIPT_SELECTOR
    )
    if (existingScript) {
      await waitForExistingScript(existingScript)
      return
    }

    const apiKey = await resolveGoogleMapsApiKey()
    if (!apiKey) {
      throw new Error(
        'Google Places API key not configured. Please configure it in Admin > Integrations > Google Maps API'
      )
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Maps API script'))
      document.head.appendChild(script)
    })
  })().catch((error) => {
    loadPromise = null
    throw error
  })

  return loadPromise
}
