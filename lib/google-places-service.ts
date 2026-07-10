let placesServiceHost: HTMLDivElement | null = null
let placesService: any = null

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement) => unknown
        places: {
          PlacesService: new (map: unknown) => {
            getDetails: (
              request: { placeId: string; fields: string[] },
              callback: (place: any, status: string) => void
            ) => void
          }
        }
      }
    }
  }
}

function getPlacesServiceHost(): HTMLDivElement {
  if (typeof document === 'undefined') {
    throw new Error('Google Places service requires a browser environment')
  }

  if (!placesServiceHost) {
    placesServiceHost = document.createElement('div')
    placesServiceHost.setAttribute('aria-hidden', 'true')
    placesServiceHost.style.cssText =
      'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none'
    document.body.appendChild(placesServiceHost)
  }

  return placesServiceHost
}

export function getSharedPlacesService() {
  if (!window.google?.maps?.places) {
    throw new Error('Google Places API is not loaded')
  }

  if (!placesService) {
    const host = getPlacesServiceHost()
    const map = new window.google.maps.Map(host)
    placesService = new window.google.maps.places.PlacesService(map)
  }

  return placesService
}
