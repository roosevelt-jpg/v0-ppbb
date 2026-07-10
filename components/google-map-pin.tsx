'use client'

import React from 'react'
import { loadGoogleMapsPlacesApi } from '@/lib/google-maps-loader'

type GoogleMapPinProps = {
  lat: number
  lng: number
  className?: string
}

export function GoogleMapPin({ lat, lng, className = 'h-48 w-full rounded-lg border border-neutral-200' }: GoogleMapPinProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!containerRef.current || !lat || !lng) return
    let map: google.maps.Map | null = null
    let cancelled = false

    loadGoogleMapsPlacesApi()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.maps) return
        map = new window.google.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        new window.google.maps.Marker({ position: { lat, lng }, map })
      })
      .catch((err) => console.warn('[GoogleMapPin]', err))

    return () => {
      cancelled = true
      map = null
    }
  }, [lat, lng])

  if (!lat || !lng) return null

  return <div ref={containerRef} className={className} aria-label="Event location map" />
}
