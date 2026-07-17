'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { SearchableSelect } from '@/components/searchable-select'
import GooglePlacesAutocomplete from '@/components/google-places-autocomplete'
import { GoogleMapPin } from '@/components/google-map-pin'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { UAE_EMIRATES, UAE_CITIES_BY_EMIRATE, isUaeCountry } from '@/lib/signup-locations'

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

function matchCityForEmirate(emirate: string, cityHint: string): string {
  const cities = UAE_CITIES_BY_EMIRATE[emirate as keyof typeof UAE_CITIES_BY_EMIRATE] || ['Other']
  const hay = cityHint.trim().toLowerCase()
  const hit = cities.find((c) => c.toLowerCase() === hay || hay.includes(c.toLowerCase()))
  return hit || cities[0] || 'Other'
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
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const countryOptions = useMemo(
    () => COUNTRY_OPTIONS.map((c) => ({ value: c.name, label: c.name })),
    []
  )

  const uae = isUaeCountry(value.country)
  const countryRestriction = value.countryCode
    ? [value.countryCode.toLowerCase()]
    : uae
      ? ['ae']
      : []

  const mapVisible =
    showMapPin ?? (variant === 'venue' && value.lat !== 0 && value.lng !== 0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/location/settings')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        const data = json?.data || {}
        setAutoDetectEnabled(data.enableAutoDetect !== false)
        if (!settingsLoaded) {
          const code = typeof data.defaultCountry === 'string' ? data.defaultCountry : 'AE'
          const match = COUNTRY_OPTIONS.find((c) => c.code === code)
          if (
            match &&
            (!value.countryCode || value.countryCode === 'AE') &&
            value.address === '' &&
            value.placeId === ''
          ) {
            // Only seed default country when still on empty defaults
            if (value.country === EMPTY_ADDRESS_LOCATION.country || !value.country) {
              onChange({
                ...value,
                country: match.name,
                countryCode: match.code,
                emirate: match.code === 'AE' ? value.emirate || 'Dubai' : '',
                city: match.code === 'AE' ? value.city || 'Dubai' : '',
              })
            }
          }
        }
        setSettingsLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setSettingsLoaded(true)
      })
    return () => {
      cancelled = true
    }
    // intentionally once on mount for settings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patch = (partial: Partial<AddressLocationValue>) => {
    onChange({ ...value, ...partial })
  }

  const handleDetect = async () => {
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

      const { latitude, longitude } = position.coords
      const res = await fetch(`/api/places/geocode?lat=${latitude}&lng=${longitude}`)
      const data = await res.json()
      if (!data.success || !data.place) {
        setDetectError(data.error || 'Could not resolve your location')
        return
      }

      const place = data.place
      const countryName =
        COUNTRY_OPTIONS.find((c) => c.code === place.countryCode)?.name ||
        place.country ||
        value.country
      const isUae = isUaeCountry(countryName)
      const emirate = isUae ? matchEmirate(place.state || place.city || '') || 'Dubai' : ''
      const city = isUae
        ? matchCityForEmirate(emirate, place.city || place.state || '')
        : place.city || ''

      onChange({
        ...value,
        country: countryName,
        countryCode: place.countryCode || value.countryCode,
        emirate,
        city: isUae ? city : value.city,
        customCity: isUae ? '' : city || value.customCity,
        address: place.formattedAddress || value.address,
        lat: place.lat ?? latitude,
        lng: place.lng ?? longitude,
        placeId: value.placeId,
      })
    } catch {
      setDetectError('Location detection failed. Select country/city and search your address.')
    } finally {
      setDetecting(false)
    }
  }

  const resolvedCityLabel = uae ? value.city : value.customCity || value.city

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">Emirate *</label>
            <select
              value={value.emirate}
              onChange={(e) => {
                const emirate = e.target.value
                const cities =
                  UAE_CITIES_BY_EMIRATE[emirate as keyof typeof UAE_CITIES_BY_EMIRATE] || ['Other']
                patch({ emirate, city: cities[0] || value.city })
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
              value={value.city}
              onChange={(e) => patch({ city: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white text-sm"
            >
              {(UAE_CITIES_BY_EMIRATE[value.emirate as keyof typeof UAE_CITIES_BY_EMIRATE] || [
                'Other',
              ]).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
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
            Venue name (optional display label)
          </label>
          <input
            type="text"
            value={value.venueName}
            onChange={(e) => patch({ venueName: e.target.value })}
            placeholder="e.g. Community Hall"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          />
        </div>
      ) : null}

      <div>
        <label className="block text-xs font-semibold text-neutral-800 mb-1">
          {addressLabel ||
            (variant === 'venue' ? 'Venue address' : 'Street address') +
              (addressRequired ? ' *' : variant === 'venue' ? ' *' : ' (optional)')}
        </label>
        <GooglePlacesAutocomplete
          value={value.address}
          countryRestrictions={countryRestriction}
          placeholder={
            addressPlaceholder ||
            (resolvedCityLabel
              ? `Search near ${resolvedCityLabel}…`
              : 'Search address or place…')
          }
          onTextChange={(text) => patch({ address: text })}
          onChange={(place) => {
            const label = place.mainText || ''
            const isUrl = /^https?:\/\//i.test(label) || /maps\.(google|app\.goo)/i.test(label)
            if (isUrl) return

            const nextCountry =
              COUNTRY_OPTIONS.find((c) => c.code === place.countryCode)?.name ||
              place.country ||
              value.country
            const nextUae = isUaeCountry(nextCountry)
            const emirate = nextUae
              ? matchEmirate(place.state || place.city || value.emirate) || value.emirate || 'Dubai'
              : ''
            const city = nextUae
              ? matchCityForEmirate(emirate, place.city || '')
              : place.city || value.customCity

            onChange({
              ...value,
              address: label,
              placeId: place.placeId?.startsWith('manual-') ? '' : place.placeId || '',
              lat: place.lat || 0,
              lng: place.lng || 0,
              country: nextCountry,
              countryCode: place.countryCode || value.countryCode,
              emirate,
              city: nextUae ? city : value.city,
              customCity: nextUae ? '' : city,
              venueName:
                variant === 'venue' && !value.venueName
                  ? place.secondaryText
                    ? place.mainText.split(',')[0] || value.venueName
                    : value.venueName
                  : value.venueName,
            })
          }}
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          Suggestions use Google Places and follow your country / city selection above.
        </p>
      </div>

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
                Pin: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {mapVisible && value.lat !== 0 && value.lng !== 0 ? (
        <GoogleMapPin
          lat={value.lat}
          lng={value.lng}
          draggable={pinDraggable || variant === 'venue'}
          onPinChange={(lat, lng) => patch({ lat, lng })}
        />
      ) : null}
    </div>
  )
}

/** Helpers for wiring into existing form shapes */
export function addressValueToEventFields(v: AddressLocationValue) {
  return {
    locationName: (v.venueName || v.address || '').trim(),
    locationAddress: v.address.trim(),
    locationPlaceId: v.placeId || '',
    locationLat: v.lat || 0,
    locationLng: v.lng || 0,
    locationCountry: v.country,
    locationCountryCode: v.countryCode,
    locationEmirate: isUaeCountry(v.country) ? v.emirate : '',
    locationCity: isUaeCountry(v.country) ? v.city : v.customCity || v.city,
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
  return {
    ...EMPTY_ADDRESS_LOCATION,
    country,
    countryCode: fields.locationCountryCode || (uae ? 'AE' : ''),
    emirate: fields.locationEmirate || (uae ? 'Dubai' : ''),
    city: uae ? fields.locationCity || 'Dubai' : '',
    customCity: uae ? '' : fields.locationCity || '',
    address: fields.locationAddress || '',
    venueName: fields.locationName || '',
    placeId: fields.locationPlaceId || '',
    lat: fields.locationLat || 0,
    lng: fields.locationLng || 0,
  }
}
