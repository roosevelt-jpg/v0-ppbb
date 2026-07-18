'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface PlacePrediction {
  placeId: string
  mainText: string
  secondaryText?: string
  lat?: number
  lng?: number
  city?: string
  state?: string
  country?: string
  countryCode?: string
}

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (place: PlacePrediction) => void
  onTextChange?: (text: string) => void
  countryRestrictions?: string[]
  placeholder?: string
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
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    setInput(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const formatPlaceLabel = (prediction: PlacePrediction) =>
    prediction.secondaryText
      ? `${prediction.mainText}, ${prediction.secondaryText}`
      : prediction.mainText

  const emitManualEntry = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const looksLikeUrl =
      /^https?:\/\//i.test(trimmed) ||
      /maps\.(google|app\.goo)/i.test(trimmed) ||
      /goo\.gl\/maps/i.test(trimmed)
    if (looksLikeUrl) {
      setError('Enter a place name or street address — Google Maps links cannot be used as the location label')
      return
    }

    onChange({
      placeId: `manual-${Date.now()}`,
      mainText: trimmed,
      secondaryText: undefined,
      lat: 0,
      lng: 0,
    })
  }

  const fetchPlacePredictions = async (searchTerm: string) => {
    const trimmed = searchTerm.trim()
    if (!trimmed) {
      setPredictions([])
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)

    try {
      const params = new URLSearchParams({ input: trimmed })
      if (countryRestrictions.length > 0) {
        params.set('countries', countryRestrictions.join(','))
      }

      const res = await fetch(`/api/places/autocomplete?${params.toString()}`)
      const data = await res.json()

      if (requestId !== requestIdRef.current) return

      if (!data.success) {
        setError(data.error || 'Location suggestions are unavailable')
        setPredictions([])
        setIsOpen(true)
        return
      }

      setPredictions(data.predictions || [])
      setIsOpen(true)
      setError(null)
    } catch {
      if (requestId !== requestIdRef.current) return
      setError('Location suggestions are unavailable')
      setPredictions([])
      setIsOpen(true)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  const schedulePredictions = (searchTerm: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPlacePredictions(searchTerm)
    }, 250)
  }

  const getPlaceDetails = async (prediction: PlacePrediction) => {
    if (prediction.placeId.startsWith('manual-')) {
      onChange(prediction)
      return
    }

    try {
      const res = await fetch(`/api/places/details?placeId=${encodeURIComponent(prediction.placeId)}`)
      const data = await res.json()

      if (!data.success || !data.place) {
        onChange({
          ...prediction,
          mainText: formatPlaceLabel(prediction),
        })
        return
      }

      onChange({
        placeId: prediction.placeId,
        mainText: data.place.formattedAddress || formatPlaceLabel(prediction),
        secondaryText: data.place.city || prediction.secondaryText,
        lat: data.place.lat,
        lng: data.place.lng,
        city: data.place.city || '',
        state: data.place.state || '',
        country: data.place.country || '',
        countryCode: data.place.countryCode || '',
      })
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
    void getPlaceDetails(prediction)
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
      schedulePredictions(nextValue)
    } else {
      setPredictions([])
      setIsOpen(false)
      setError(null)
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
    setError(null)
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
    <div className="relative w-full max-w-md">
      {error && (
        <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {error}. You can still type a location and continue.
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => input && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300 bg-white text-neutral-900"
        />
        {input && (
          <button
            type="button"
            onClick={handleClear}
            className="pb-ghost-btn absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700"
            aria-label="Clear address"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 w-full max-w-sm overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg max-h-56"
        >
          {loading && (
            <div className="p-3 text-center text-neutral-500 text-sm">
              <div className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            </div>
          )}

          {!loading && predictions.length === 0 && input.trim() && (
            <div className="space-y-2 p-2.5">
              <div className="text-center text-neutral-500 text-xs">No locations found</div>
              <div
                role="option"
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleManualEntry}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleManualEntry()
                  }
                }}
                className="w-full cursor-pointer rounded-md border border-neutral-300 bg-white p-2.5 text-left transition hover:bg-neutral-50"
              >
                <p className="font-medium text-neutral-900 text-sm">Use entered location</p>
                <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">&quot;{input.trim()}&quot;</p>
              </div>
            </div>
          )}

          {predictions.map((prediction) => (
            <div
              key={prediction.placeId}
              role="option"
              tabIndex={0}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectPrediction(prediction)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectPrediction(prediction)
                }
              }}
              className="w-full cursor-pointer border-b border-neutral-100 bg-white p-2.5 text-left last:border-b-0 transition hover:bg-neutral-50"
            >
              <p className="font-medium text-neutral-900 text-sm leading-snug">{prediction.mainText}</p>
              {prediction.secondaryText ? (
                <p className="text-xs text-neutral-600 mt-0.5 leading-snug">{prediction.secondaryText}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
