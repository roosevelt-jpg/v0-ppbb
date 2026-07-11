'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Download, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { getEventPriceCornerLabel, hostFromEventDoc } from '@/lib/event-host'
import { getEventTimeRangeLabel } from '@/lib/event-utils'

type EventCardEvent = Record<string, unknown> & {
  id?: string
  slug?: string
  title?: string
  description?: string
  category?: string
  date?: unknown
  time?: string
  endTime?: string
  location?: string
  locationName?: string
  bannerImage?: string
  bannerURL?: string
  registered?: number
  capacity?: number
  currentAttendees?: number
  maxAttendees?: number | null
  genderRestriction?: string
  tags?: string[]
}

interface EventCardProps {
  event: EventCardEvent
  showActions?: boolean
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate()
    } catch {
      return null
    }
  }
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? null : d
}

function getTimeLabel(event: EventCardEvent): string {
  return getEventTimeRangeLabel(event as Parameters<typeof getEventTimeRangeLabel>[0])
}

function getLocationLabel(event: EventCardEvent): string {
  const name = typeof event.locationName === 'string' ? event.locationName.trim() : ''
  const loc = typeof event.location === 'string' ? event.location.trim() : ''
  const address = typeof event.locationAddress === 'string' ? event.locationAddress.trim() : ''
  return name || loc || address || 'Location TBA'
}

export default function EventCard({ event, showActions = true }: EventCardProps) {
  const title = (typeof event.title === 'string' && event.title.trim()) || 'Untitled event'
  const description =
    typeof event.description === 'string' ? event.description.trim() : ''
  const showDescription = Boolean(description && description !== title)

  const banner =
    (typeof event.bannerURL === 'string' && event.bannerURL) ||
    (typeof event.bannerImage === 'string' && event.bannerImage) ||
    (typeof event.bannerImageUrl === 'string' ? (event.bannerImageUrl as string) : '') ||
    ''

  const priceLabel = getEventPriceCornerLabel(event)
  const host = hostFromEventDoc(event)
  const businessName = host?.businessName || ''
  const ownerName = host?.ownerName || ''
  const logoUrl = host?.businessLogoUrl || ''

  const start = toDate(event.startDate) || toDate(event.date)
  const timeLabel = getTimeLabel(event)
  const locationLabel = getLocationLabel(event)
  const attending =
    typeof event.currentAttendees === 'number'
      ? event.currentAttendees
      : typeof event.registered === 'number'
        ? event.registered
        : 0
  const capacity =
    typeof event.maxAttendees === 'number'
      ? event.maxAttendees
      : typeof event.capacity === 'number'
        ? event.capacity
        : null

  const href = `/events/${event.id || event.slug || ''}`

  const handleAddToCalendar = () => {
    const startDate = start || new Date()
    const dtstart = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endDate = new Date(startDate)
    if (typeof event.endTime === 'string' && event.endTime.includes(':')) {
      const [endHour, endMin] = event.endTime.split(':')
      endDate.setHours(parseInt(endHour, 10), parseInt(endMin, 10))
    } else {
      endDate.setHours(endDate.getHours() + 2)
    }
    const dtend = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Passive Blessings//Event//EN
BEGIN:VEVENT
UID:${event.id || 'event'}@passiveblessings.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${title}
DESCRIPTION:${description || title}
LOCATION:${locationLabel}
END:VEVENT
END:VCALENDAR`

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent))
    element.setAttribute('download', `${event.slug || event.id || 'event'}.ics`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border border-gray-200 h-full flex flex-col">
      <div className="relative w-full bg-gray-200 overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        {banner ? (
          <img src={banner} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-gray-500 text-sm">No image</span>
          </div>
        )}

        {/* Free / Price — banner top corner (not gender) */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded text-xs font-semibold bg-black text-white shadow-sm">
          {priceLabel}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Host: logo + business + owner (once) */}
        {(logoUrl || businessName || ownerName) && (
          <div className="flex items-center gap-2.5 mb-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName || 'Host'}
                className="h-9 w-9 rounded-full object-cover border border-neutral-200 shrink-0 bg-white"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {(businessName || ownerName || 'E').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              {businessName ? (
                <p className="text-sm font-semibold text-neutral-900 truncate">{businessName}</p>
              ) : null}
              {ownerName && ownerName !== businessName ? (
                <p className="text-xs text-neutral-500 truncate">{ownerName}</p>
              ) : null}
            </div>
          </div>
        )}

        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">{title}</h3>
        {typeof event.category === 'string' && event.category.trim() ? (
          <p className="text-sm font-medium text-neutral-700 mb-2 capitalize">
            {event.category.replace(/-/g, ' ')}
          </p>
        ) : null}

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-start gap-2 text-gray-700">
            <Calendar size={16} className="flex-shrink-0 mt-0.5 text-neutral-900" />
            <span>{start ? format(start, 'MMM d, yyyy') : 'Date TBA'}</span>
          </div>
          {timeLabel ? (
            <div className="flex items-start gap-2 text-gray-700">
              <Clock size={16} className="flex-shrink-0 mt-0.5 text-neutral-900" />
              <span>{timeLabel}</span>
            </div>
          ) : null}
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin size={16} className="flex-shrink-0 mt-0.5 text-neutral-900" />
            <span className="line-clamp-1">{locationLabel}</span>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <Users size={16} className="flex-shrink-0 mt-0.5 text-neutral-900" />
            <span>
              {capacity != null ? `${attending}/${capacity} attending` : `${attending} attending`}
            </span>
          </div>
        </div>

        {showDescription ? (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{description}</p>
        ) : (
          <div className="flex-1" />
        )}

        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Link
              href={href}
              className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition text-center"
            >
              View Details
            </Link>
            <button
              type="button"
              onClick={handleAddToCalendar}
              className="px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition flex items-center justify-center min-w-[44px] min-h-[44px]"
              title="Add to calendar"
              aria-label="Add to calendar"
            >
              <Download size={14} className="text-white" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
