'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface PlacePrediction {
  placeId: string
  mainText: string
  secondaryText?: string
  lat?: number
  lng?: number
}

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (place: PlacePrediction) => void
  countryRestrictions?: string[]
  placeholder?: string
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          AutocompleteService: any
          PlacesService: any
        }
      }
    }
  }
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  countryRestrictions = [],
  placeholder = 'Search location...',
}: GooglePlacesAutocompleteProps) {
  const [input, setInput] = useState(value)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const autocompleteService = useRef<any>(null)
  const placesService = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load Google Maps API on mount
  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      if (window.google) return

      // First try environment variable, then fetch from integrations API
      let apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      
      if (!apiKey) {
        try {
          const res = await fetch('/api/admin/integrations/googleMaps')
          if (res.ok) {
            const data = await res.json()
            apiKey = data.data?.apiKey
          }
        } catch (error) {
          console.warn('[v0] Failed to fetch Google Maps API key from integrations:', error)
        }
      }

      if (!apiKey) {
        console.warn('[v0] Google Places API key not configured. Please configure it in Admin > Integrations > Google Maps API')
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google?.maps?.places) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          // Create a dummy map for PlacesService
          const dummyDiv = document.createElement('div')
          mapRef.current = new window.google.maps.Map(dummyDiv)
          placesService.current = new window.google.maps.places.PlacesService(mapRef.current)
        }
      }
      script.onerror = () => {
        console.error('[v0] Failed to load Google Maps API')
      }
      document.head.appendChild(script)
    }

    loadGoogleMapsAPI()
  }, [])

  const fetchPlacePredictions = async (searchTerm: string) => {
    if (!searchTerm.trim() || !autocompleteService.current) {
      setPredictions([])
      return
    }

    setLoading(true)
    try {
      const response = await autocompleteService.current.getPlacePredictions({
        input: searchTerm,
        componentRestrictions: countryRestrictions.length > 0 
          ? { country: countryRestrictions }
          : undefined,
      })

      if (response.predictions) {
        const formattedPredictions = response.predictions.map((prediction: any) => ({
          placeId: prediction.place_id,
          mainText: prediction.structured_formatting?.main_text || prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text,
        }))
        setPredictions(formattedPredictions)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('[v0] Error fetching predictions:', error)
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  const getPlaceDetails = (placeId: string) => {
    if (!placesService.current) return

    placesService.current.getDetails(
      { placeId, fields: ['geometry', 'formatted_address'] },
      (place: any, status: string) => {
        if (status === 'OK' && place.geometry) {
          const prediction = predictions.find(p => p.placeId === placeId)
          if (prediction) {
            onChange({
              ...prediction,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            })
          }
        }
      }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    if (value.trim()) {
      fetchPlacePredictions(value)
    } else {
      setPredictions([])
      setIsOpen(false)
    }
  }

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    setInput(prediction.mainText)
    setPredictions([])
    setIsOpen(false)
    getPlaceDetails(prediction.placeId)
  }

  const handleClear = () => {
    setInput('')
    setPredictions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => input && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
        {input && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
          )}
          
          {!loading && predictions.length === 0 && input.trim() && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No locations found
            </div>
          )}

          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full text-left p-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition"
            >
              <p className="font-medium text-gray-900">{prediction.mainText}</p>
              {prediction.secondaryText && (
                <p className="text-sm text-gray-600">{prediction.secondaryText}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
