'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Download } from 'lucide-react'
import { format } from 'date-fns'
import { getEventPriceCornerLabel, hostFromEventDoc } from '@/lib/event-host'
import { getEventLocationLabel, getEventTimeRangeLabel } from '@/lib/event-utils'

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
  return getEventLocationLabel(event as Parameters<typeof getEventLocationLabel>[0])
}

/** Shorten long map URLs for compact cards */
function formatLocationDisplay(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) return 'Location TBA'
  if (/^https?:\/\//i.test(trimmed)) return 'View map'
  return trimmed
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
  const locationLabel = formatLocationDisplay(getLocationLabel(event))
  const attending =
    typeof event.currentAttendees === 'number'
      ? event.currentAttendees
      : typeof event.registered === 'number'
        ? event.registered
        : 0
  const capacity =
    typeof event.maxAttendees === 'number' && event.maxAttendees > 0
      ? event.maxAttendees
      : typeof event.capacity === 'number' && event.capacity > 0
        ? event.capacity
        : Array.isArray(event.ticketTypes)
          ? (() => {
              const caps = (event.ticketTypes as { capacity?: number | null }[])
                .map((t) => t.capacity)
                .filter((c): c is number => typeof c === 'number' && c > 0)
              return caps.length ? caps.reduce((a, b) => a + b, 0) : null
            })()
          : null
  const isFull = capacity != null && attending >= capacity

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
LOCATION:${getLocationLabel(event)}
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

  const datePart = start ? format(start, 'MMM d, yyyy') : 'Date TBA'
  const whenLabel = timeLabel ? `${datePart} · ${timeLabel}` : datePart
  const attendeesLabel =
    capacity != null
      ? isFull
        ? `${attending}/${capacity} · Full`
        : `${attending}/${capacity} attending`
      : `${attending} attending`

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden border border-gray-200 h-full flex flex-col">
      {/* Shorter banner — fixed height instead of tall 16:9 block */}
      <div className="relative w-full h-28 sm:h-32 bg-gray-200 overflow-hidden shrink-0">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-gray-500 text-xs">No image</span>
          </div>
        )}

        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black text-white shadow-sm">
          {priceLabel}
        </div>
        {isFull ? (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-600 text-white shadow-sm">
            Full
          </div>
        ) : null}
      </div>

      <div className="p-3 flex-1 flex flex-col gap-1.5 min-h-0">
        {(logoUrl || businessName || ownerName) && (
          <div className="flex items-center gap-1.5 min-w-0">
            {logoUrl && businessName !== 'Admin' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={businessName || 'Host'}
                className="h-6 w-6 rounded-full object-cover border border-neutral-200 shrink-0 bg-white"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {(businessName || ownerName || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-xs font-medium text-neutral-700 truncate min-w-0">
              {businessName === 'Admin'
                ? 'Admin'
                : [businessName, ownerName !== businessName ? ownerName : null]
                    .filter(Boolean)
                    .join(' · ') || 'Host'}
            </p>
          </div>
        )}

        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{title}</h3>
          {typeof event.category === 'string' && event.category.trim() ? (
            <p className="text-[11px] font-medium text-neutral-500 capitalize mt-0.5 truncate">
              {event.category.replace(/-/g, ' ')}
            </p>
          ) : null}
        </div>

        <div className="space-y-1 text-[11px] text-gray-700">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar size={12} className="shrink-0 text-neutral-900" />
            <span className="truncate">{whenLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={12} className="shrink-0 text-neutral-900" />
            <span className="truncate">{locationLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Users size={12} className="shrink-0 text-neutral-900" />
            <span className="truncate">{attendeesLabel}</span>
          </div>
        </div>

        {showDescription ? (
          <p className="text-[11px] text-gray-600 line-clamp-1">{description}</p>
        ) : null}

        {showActions && (
          <div className="flex gap-1.5 mt-auto pt-2 border-t border-gray-100">
            <Link
              href={href}
              className="pb-compact-btn flex-1 inline-flex items-center justify-center h-7 px-2 rounded-md bg-black !text-white text-[11px] font-semibold hover:bg-neutral-800"
            >
              View Details
            </Link>
            <button
              type="button"
              onClick={handleAddToCalendar}
              className="pb-compact-btn inline-flex items-center justify-center h-7 w-7 rounded-md bg-black !text-white hover:bg-neutral-800"
              title="Add to calendar"
              aria-label="Add to calendar"
            >
              <Download size={12} className="text-white" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
