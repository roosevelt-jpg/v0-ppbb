'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { SearchableSelect } from '@/components/searchable-select'
import GooglePlacesAutocomplete from '@/components/google-places-autocomplete'
import { GoogleMapPin } from '@/components/google-map-pin'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import {
  UAE_EMIRATES,
  citiesForEmirate,
  defaultCityForEmirate,
  isUaeCountry,
  matchCityForEmirate,
} from '@/lib/signup-locations'

export type AddressLocationValue = {
  country: string
  countryCode: string
  emirate: string
  city: string
  customCity: string
  address: string
  venueName: string
  placeId: string
  lat: number
  lng: number
}

export const EMPTY_ADDRESS_LOCATION: AddressLocationValue = {
  country: 'United Arab Emirates',
  countryCode: 'AE',
  emirate: 'Dubai',
  city: 'Dubai',
  customCity: '',
  address: '',
  venueName: '',
  placeId: '',
  lat: 0,
  lng: 0,
}

type AddressLocationPickerProps = {
  value: AddressLocationValue
  onChange: (next: AddressLocationValue) => void
  /** profile = signup/member; venue = admin/business events */
  variant?: 'profile' | 'venue'
  showAutoDetect?: boolean
  showMapPin?: boolean
  /** Draggable pin (venue forms) */
  pinDraggable?: boolean
  className?: string
  addressLabel?: string
  addressPlaceholder?: string
  addressRequired?: boolean
}

function matchEmirate(stateOrCity: string): string {
  const hay = stateOrCity.trim().toLowerCase()
  return (
    UAE_EMIRATES.find(
      (e) => hay.includes(e.toLowerCase()) || e.toLowerCase().includes(hay)
    ) || ''
  )
}

function friendlyMapsError(raw: string): string {
  const msg = String(raw || '')
  if (/not authorized|REQUEST_DENIED|ApiNotActivated|API key/i.test(msg)) {
    return 'Location lookup is temporarily unavailable. You can still enter your address manually below.'
  }
  if (/OVER_QUERY_LIMIT|quota/i.test(msg)) {
    return 'Location lookup is busy right now. Enter your address manually and continue.'
  }
  return msg || 'Could not resolve your location. Enter your address manually.'
}

type GooglePlaceBits = {
  country?: string
  countryCode?: string
  state?: string
  city?: string
  formattedAddress?: string
  lat?: number
  lng?: number
}

/** Map a Google Geocoding / Place Details result onto the global country list. */
function locationFromGoogle(
  place: GooglePlaceBits,
  prev: AddressLocationValue
): Partial<AddressLocationValue> {
  const code = (place.countryCode || '').trim().toUpperCase()
  const byCode = code ? COUNTRY_OPTIONS.find((c) => c.code === code) : undefined
  const byName =
    !byCode && place.country
      ? COUNTRY_OPTIONS.find((c) => c.name.toLowerCase() === place.country!.trim().toLowerCase())
      : undefined
  const country = byCode?.name || byName?.name || place.country || prev.country
  const countryCode = byCode?.code || byName?.code || code || prev.countryCode
  const nextUae = isUaeCountry(country)
  const emirate = nextUae
    ? matchEmirate(place.state || place.city || '') || prev.emirate || 'Dubai'
    : ''
  const cityHint = (place.city || (!nextUae ? '' : place.state) || '').trim()
  const city = nextUae ? matchCityForEmirate(emirate, cityHint) : cityHint
  const customCity = nextUae ? (city === 'Other' ? cityHint || prev.customCity : '') : cityHint
  return {
    country,
    countryCode,
    emirate,
    city,
    customCity,
    ...(typeof place.lat === 'number' ? { lat: place.lat } : {}),
    ...(typeof place.lng === 'number' ? { lng: place.lng } : {}),
    ...(place.formattedAddress ? { address: place.formattedAddress } : {}),
  }
}

export function AddressLocationPicker({
  value,
  onChange,
  variant = 'profile',
  showAutoDetect = true,
  showMapPin,
  pinDraggable = false,
  className = '',
  addressLabel,
  addressPlaceholder,
  addressRequired = false,
}: AddressLocationPickerProps) {
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true)
  const valueRef = React.useRef(value)
  const onChangeRef = React.useRef(onChange)
  const skipAutoRef = React.useRef(false)
  valueRef.current = value
  onChangeRef.current = onChange

  const countryOptions = useMemo(() => {
    const options = COUNTRY_OPTIONS.map((c) => ({ value: c.name, label: c.name }))
    if (value.country && !options.some((option) => option.value === value.country)) {
      options.unshift({ value: value.country, label: value.country })
    }
    return options
  }, [value.country])

  const uae = isUaeCountry(value.country)

  const mapVisible =
    showMapPin ?? (variant === 'venue' ? true : value.lat !== 0 && value.lng !== 0)

  const resolvedCityLabel = uae
    ? value.city === 'Other'
      ? value.customCity || 'Other'
      : value.city
    : value.customCity || value.city

  const publish = (partial: Partial<AddressLocationValue>) => {
    onChangeRef.current({ ...valueRef.current, ...partial })
  }

  const applyGoogle = (place: GooglePlaceBits, keepAddress = false) => {
    const prev = valueRef.current
    const next = locationFromGoogle(place, prev)
    if (keepAddress) delete next.address
    onChangeRef.current({ ...prev, ...next })
  }

  const geocodeCoords = async (latitude: number, longitude: number) => {
    const res = await fetch(`/api/places/geocode?lat=${latitude}&lng=${longitude}`)
    const data = await res.json()
    if (!data.success || !data.place) {
      throw new Error(friendlyMapsError(data.error || 'Could not resolve your location'))
    }
    return data.place as GooglePlaceBits
  }

  useEffect(() => {
    let cancelled = false
    fetch('/api/location/settings')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        const data = json?.data || {}
        const enabled = data.enableAutoDetect !== false
        setAutoDetectEnabled(enabled)
        const current = valueRef.current
        if (!current.placeId && !current.address.trim() && !skipAutoRef.current) {
          const code = typeof data.defaultCountry === 'string' ? data.defaultCountry : 'AE'
          const match = COUNTRY_OPTIONS.find((c) => c.code === code.toUpperCase())
          if (match && (!current.country || current.country === EMPTY_ADDRESS_LOCATION.country)) {
            onChangeRef.current({
              ...current,
              country: match.name,
              countryCode: match.code,
              emirate: match.code === 'AE' ? current.emirate || 'Dubai' : '',
              city: match.code === 'AE' ? current.city || 'Dubai' : '',
              customCity: match.code === 'AE' ? '' : current.customCity,
            })
          }
        }
        if (enabled && showAutoDetect && variant === 'profile') {
          void detectFromGoogle(true)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // Settings and the first GPS lookup run once per picker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patch = (partial: Partial<AddressLocationValue>) => {
    skipAutoRef.current = true
    publish(partial)
  }

  async function detectFromGoogle(automatic = false) {
    if (automatic && (skipAutoRef.current || valueRef.current.placeId || valueRef.current.address.trim())) return
    setDetecting(true)
    setDetectError(null)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'))
          return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
        })
      })
      if (automatic && (skipAutoRef.current || valueRef.current.placeId || valueRef.current.address.trim())) return

      const { latitude, longitude } = position.coords
      const place = await geocodeCoords(latitude, longitude)
      if (automatic && (skipAutoRef.current || valueRef.current.placeId || valueRef.current.address.trim())) return
      applyGoogle(
        {
          ...place,
          lat: place.lat ?? latitude,
          lng: place.lng ?? longitude,
        },
        Boolean(valueRef.current.address.trim())
      )
    } catch {
      if (!automatic) {
        setDetectError(
          'Location detection failed. Search a place below, or choose the country yourself.'
        )
      }
    } finally {
      setDetecting(false)
    }
  }

  const handleDetect = () => {
    skipAutoRef.current = false
    void detectFromGoogle(false)
  }

  const applyPlaceSelection = (place: {
    placeId: string
    mainText: string
    secondaryText?: string
    name?: string
    lat?: number
    lng?: number
    city?: string
    state?: string
    country?: string
    countryCode?: string
  }) => {
    const label = place.mainText || ''
    const isUrl = /^https?:\/\//i.test(label) || /maps\.(google|app\.goo)/i.test(label)
    if (isUrl) return

    const current = valueRef.current
    const fromGoogle = place.countryCode || place.country
      ? locationFromGoogle(
          {
            country: place.country,
            countryCode: place.countryCode,
            state: place.state,
            city: place.city,
            lat: place.lat || 0,
            lng: place.lng || 0,
          },
          current
        )
      : {}
    const venueFromPlace =
      (place.name && place.name.trim()) ||
      (place.secondaryText ? place.mainText.split(',')[0]?.trim() : '') ||
      ''

    skipAutoRef.current = true
    onChangeRef.current({
      ...current,
      ...fromGoogle,
      address: label,
      placeId: place.placeId?.startsWith('manual-') ? '' : place.placeId || '',
      lat: place.lat || fromGoogle.lat || 0,
      lng: place.lng || fromGoogle.lng || 0,
      venueName:
        variant === 'venue'
          ? current.venueName?.trim() || venueFromPlace || current.venueName
          : current.venueName,
    })
  }

  const placesSearchBlock = (
    <div>
      <label className="block text-xs font-semibold text-neutral-800 mb-1">
        {addressLabel ||
          (variant === 'venue'
            ? `Search exact venue or street address${addressRequired || true ? ' *' : ''}`
            : `Street address${addressRequired ? ' *' : ' (optional)'}`)}
      </label>
      <GooglePlacesAutocomplete
        value={value.address}
        placeholder={
          addressPlaceholder ||
          (variant === 'venue'
            ? 'Start typing a place, mall, hotel, or street address…'
            : 'Search any place — country follows Google')
        }
        onTextChange={(text) => patch({ address: text })}
        onChange={applyPlaceSelection}
      />
      <p className="mt-1 text-[11px] text-neutral-500">
        {variant === 'venue'
          ? 'Pick a suggestion. Country, city, and the map pin follow that Google result.'
          : 'Pick a suggestion and the country updates from Google. You can still change it.'}
      </p>
    </div>
  )

  return (
    <div className={`space-y-3 ${className}`}>
      {showAutoDetect && autoDetectEnabled ? (
        <button
          type="button"
          onClick={() => void handleDetect()}
          disabled={detecting}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-8 px-3 rounded-md bg-black !text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-60"
        >
          {detecting ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
          {detecting ? 'Detecting…' : 'Use my current location'}
        </button>
      ) : null}
      {detectError ? <p className="text-xs text-amber-700">{detectError}</p> : null}

      {placesSearchBlock}

      <SearchableSelect
        label="Country"
        value={value.country}
        options={countryOptions}
        onChange={(name) => {
          const match = COUNTRY_OPTIONS.find((c) => c.name === name)
          const nextUae = isUaeCountry(name)
          patch({
            country: name,
            countryCode: match?.code || '',
            emirate: nextUae ? value.emirate || 'Dubai' : '',
            city: nextUae ? value.city || 'Dubai' : '',
            customCity: nextUae ? '' : value.customCity,
          })
        }}
        placeholder="Search countries…"
        required
      />

      {uae ? (
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">Emirate *</label>
            <select
              value={value.emirate}
              onChange={(e) => {
                const emirate = e.target.value
                patch({
                  emirate,
                  city: defaultCityForEmirate(emirate),
                  customCity: '',
                })
              }}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white text-sm"
            >
              {UAE_EMIRATES.map((emirate) => (
                <option key={emirate} value={emirate}>
                  {emirate}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">City / Area *</label>
            <select
              value={citiesForEmirate(value.emirate).includes(value.city) ? value.city : ''}
              onChange={(e) => {
                const city = e.target.value
                patch({
                  city,
                  customCity: city === 'Other' ? value.customCity : '',
                })
              }}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white text-sm"
            >
              {citiesForEmirate(value.emirate).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {value.city === 'Other' ? (
              <input
                type="text"
                value={value.customCity}
                onChange={(e) => patch({ customCity: e.target.value })}
                placeholder="Enter your city / area"
                className="mt-2 w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-1">City *</label>
          <input
            type="text"
            value={value.customCity}
            onChange={(e) => patch({ customCity: e.target.value, city: e.target.value })}
            placeholder="Enter your city"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          />
        </div>
      )}

      {variant === 'venue' ? (
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-1">
            Venue display name (optional)
          </label>
          <input
            type="text"
            value={value.venueName}
            onChange={(e) => patch({ venueName: e.target.value })}
            placeholder="e.g. Community Hall — shown on event cards with the street address"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          />
        </div>
      ) : null}

      {value.address && !/^https?:\/\//i.test(value.address) ? (
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex gap-2">
          <MapPin size={16} className="text-neutral-700 shrink-0 mt-0.5" />
          <div className="text-sm min-w-0">
            <p className="font-medium text-neutral-900 break-words">
              {value.venueName ? `${value.venueName} — ` : ''}
              {value.address}
            </p>
            <p className="text-xs text-neutral-600">
              {[uae ? value.emirate : null, resolvedCityLabel, value.country]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {value.lat !== 0 && value.lng !== 0 ? (
              <p className="text-xs text-neutral-500 mt-0.5">
                Exact pin: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
              </p>
            ) : (
              <p className="text-xs text-amber-700 mt-0.5">
                Tip: pick a Google suggestion so the map pin and public card get the exact address.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {mapVisible && value.lat !== 0 && value.lng !== 0 ? (
        <GoogleMapPin
          lat={value.lat}
          lng={value.lng}
          draggable={pinDraggable || variant === 'venue'}
          onPinChange={(lat, lng) => {
            publish({ lat, lng })
            void geocodeCoords(lat, lng)
              .then((place) => applyGoogle({ ...place, lat, lng }, true))
              .catch(() => {})
          }}
        />
      ) : variant === 'venue' ? (
        <p className="text-xs text-neutral-500 rounded-lg border border-dashed border-neutral-300 p-3">
          Map preview appears after you select a Google Places suggestion (or drag a pin once
          coordinates are set).
        </p>
      ) : null}
    </div>
  )
}

/** Helpers for wiring into existing form shapes */
export function addressValueToEventFields(v: AddressLocationValue) {
  const address = v.address.trim()
  const venue = v.venueName.trim()
  return {
    locationName: venue || address,
    locationAddress: address || venue,
    locationPlaceId: v.placeId || '',
    locationLat: v.lat || 0,
    locationLng: v.lng || 0,
    locationCountry: v.country,
    locationCountryCode: v.countryCode,
    locationEmirate: isUaeCountry(v.country) ? v.emirate : '',
    locationCity: isUaeCountry(v.country)
      ? v.city === 'Other'
        ? v.customCity || v.city
        : v.city
      : v.customCity || v.city,
  }
}

export function eventFieldsToAddressValue(fields: {
  locationName?: string
  locationAddress?: string
  locationPlaceId?: string
  locationLat?: number
  locationLng?: number
  locationCountry?: string
  locationCountryCode?: string
  locationEmirate?: string
  locationCity?: string
}): AddressLocationValue {
  const country = fields.locationCountry || EMPTY_ADDRESS_LOCATION.country
  const uae = isUaeCountry(country)
  const address = fields.locationAddress || ''
  const name = fields.locationName || ''
  // Avoid duplicating the street address into venueName when they match
  const venueName =
    name && address && name.trim().toLowerCase() === address.trim().toLowerCase() ? '' : name

  return {
    ...EMPTY_ADDRESS_LOCATION,
    country,
    countryCode: fields.locationCountryCode || (uae ? 'AE' : ''),
    emirate: fields.locationEmirate || (uae ? 'Dubai' : ''),
    city: uae ? fields.locationCity || 'Dubai' : '',
    customCity: uae ? '' : fields.locationCity || '',
    address: address || name,
    venueName,
    placeId: fields.locationPlaceId || '',
    lat: fields.locationLat || 0,
    lng: fields.locationLng || 0,
  }
}
