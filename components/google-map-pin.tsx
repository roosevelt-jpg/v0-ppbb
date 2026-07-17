'use client'

import React from 'react'
import { loadGoogleMapsPlacesApi } from '@/lib/google-maps-loader'

type GoogleMapPinProps = {
  lat: number
  lng: number
  className?: string
  draggable?: boolean
  onPinChange?: (lat: number, lng: number) => void
}

export function GoogleMapPin({
  lat,
  lng,
  className = 'h-48 w-full rounded-lg border border-neutral-200',
  draggable = false,
  onPinChange,
}: GoogleMapPinProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const onPinChangeRef = React.useRef(onPinChange)
  onPinChangeRef.current = onPinChange

  React.useEffect(() => {
    if (!containerRef.current || !lat || !lng) return
    let map: google.maps.Map | null = null
    let marker: google.maps.Marker | null = null
    let cancelled = false
    let dragListener: google.maps.MapsEventListener | null = null

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
        marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: Boolean(draggable),
        })
        if (draggable && marker) {
          dragListener = marker.addListener('dragend', () => {
            const pos = marker?.getPosition()
            if (!pos) return
            onPinChangeRef.current?.(pos.lat(), pos.lng())
          })
        }
      })
      .catch((err) => console.warn('[GoogleMapPin]', err))

    return () => {
      cancelled = true
      if (dragListener) dragListener.remove()
      marker = null
      map = null
    }
  }, [lat, lng, draggable])

  if (!lat || !lng) return null

  return (
    <div className="space-y-1">
      <div ref={containerRef} className={className} aria-label="Location map pin" />
      {draggable ? (
        <p className="text-xs text-neutral-500">Drag the pin to set the exact venue location.</p>
      ) : null}
    </div>
  )
}
