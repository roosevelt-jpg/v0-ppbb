'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { loadGoogleMapsPlacesApi } from '@/lib/google-maps-loader'
import { getSharedPlacesService } from '@/lib/google-places-service'

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
  onTextChange?: (text: string) => void
  countryRestrictions?: string[]
  placeholder?: string
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: Record<string, unknown>,
              callback: (predictions: any[] | null, status: string) => void
            ) => void
          }
        }
      }
    }
  }
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  onTextChange,
  countryRestrictions = [],
  placeholder = 'Search location...',
}: GooglePlacesAutocompleteProps) {
  const [input, setInput] = useState(value)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiReady, setApiReady] = useState(false)
  const autocompleteService = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInput(value)
  }, [value])

  useEffect(() => {
    let cancelled = false

    loadGoogleMapsPlacesApi()
      .then(() => {
        if (cancelled || !window.google?.maps?.places) {
          if (!cancelled) setError('Failed to initialize Places services')
          return
        }

        autocompleteService.current = new window.google.maps.places.AutocompleteService()
        getSharedPlacesService()
        setApiReady(true)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Failed to load Google Maps API'
        console.warn('[v0]', msg)
        setError(msg)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const formatPlaceLabel = (prediction: PlacePrediction) =>
    prediction.secondaryText
      ? `${prediction.mainText}, ${prediction.secondaryText}`
      : prediction.mainText

  const emitManualEntry = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    onChange({
      placeId: `manual-${Date.now()}`,
      mainText: trimmed,
      secondaryText: undefined,
      lat: 0,
      lng: 0,
    })
  }

  const fetchPlacePredictions = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setPredictions([])
      return
    }

    if (!autocompleteService.current) {
      setError('Google Places service not initialized')
      setPredictions([])
      return
    }

    setLoading(true)

    autocompleteService.current.getPlacePredictions(
      {
        input: searchTerm,
        componentRestrictions:
          countryRestrictions.length > 0 ? { country: countryRestrictions } : undefined,
      },
      (results: any[] | null, status: string) => {
        if (status !== 'OK' && status !== 'ZERO_RESULTS') {
          setError(
            status === 'REQUEST_DENIED'
              ? 'Google API key not authorized for Places API'
              : `Location service: ${status}`
          )
          setPredictions([])
          setLoading(false)
          return
        }

        if (!results || results.length === 0) {
          setPredictions([])
          setError(null)
          setLoading(false)
          return
        }

        setPredictions(
          results.map((prediction) => ({
            placeId: prediction.place_id,
            mainText: prediction.structured_formatting?.main_text || prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text,
          }))
        )
        setIsOpen(true)
        setError(null)
        setLoading(false)
      }
    )
  }

  const getPlaceDetails = (prediction: PlacePrediction) => {
    try {
      const placesService = getSharedPlacesService()
      placesService.getDetails(
        { placeId: prediction.placeId, fields: ['geometry', 'formatted_address', 'address_components'] },
        (place: any, status: string) => {
          if (status !== 'OK' || !place?.geometry) {
            onChange({
              ...prediction,
              mainText: formatPlaceLabel(prediction),
            })
            return
          }

          const city = place.address_components?.find((c: any) => c.types.includes('locality'))
            ?.long_name

          onChange({
            placeId: prediction.placeId,
            mainText: formatPlaceLabel(prediction),
            secondaryText: city || prediction.secondaryText,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          })
        }
      )
    } catch {
      onChange({
        ...prediction,
        mainText: formatPlaceLabel(prediction),
      })
    }
  }

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    const label = formatPlaceLabel(prediction)
    setInput(label)
    setPredictions([])
    setIsOpen(false)
    onTextChange?.(label)

    if (prediction.placeId.startsWith('manual-')) {
      onChange(prediction)
      return
    }

    getPlaceDetails(prediction)
  }

  const handleManualEntry = () => {
    if (!input.trim()) return
    const manualPrediction: PlacePrediction = {
      placeId: `manual-${Date.now()}`,
      mainText: input.trim(),
      secondaryText: undefined,
      lat: 0,
      lng: 0,
    }
    handleSelectPrediction(manualPrediction)
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value
    setInput(nextValue)
    onTextChange?.(nextValue)

    if (nextValue.trim()) {
      if (apiReady && autocompleteService.current) {
        fetchPlacePredictions(nextValue)
      }
    } else {
      setPredictions([])
      setIsOpen(false)
    }
  }

  const handleBlur = () => {
    window.setTimeout(() => {
      setIsOpen(false)
      if (input.trim()) {
        emitManualEntry(input)
      }
    }, 150)
  }

  const handleClear = () => {
    setInput('')
    setPredictions([])
    setIsOpen(false)
    onTextChange?.('')
    onChange({
      placeId: '',
      mainText: '',
      secondaryText: undefined,
      lat: 0,
      lng: 0,
    })
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      {error && (
        <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => input && setIsOpen(true)}
          placeholder={placeholder}
          disabled={!apiReady}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
            !apiReady ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
          }`}
        />
        {input && apiReady && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && apiReady && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
          )}

          {!loading && predictions.length === 0 && input.trim() && (
            <div className="space-y-2 p-3">
              <div className="text-center text-gray-500 text-sm">No locations found</div>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleManualEntry}
                className="w-full p-3 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
              >
                <p className="font-medium text-blue-900 text-sm">Use entered location</p>
                <p className="text-xs text-blue-700">&quot;{input.trim()}&quot;</p>
              </button>
            </div>
          )}

          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
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
