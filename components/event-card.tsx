'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, CalendarPlus } from 'lucide-react'
import { format } from 'date-fns'
import { getEventPriceCornerLabel, hostFromEventDoc } from '@/lib/event-host'
import { getEventLocationLabel, getEventTimeRangeLabel } from '@/lib/event-utils'
import { openGoogleCalendarForEvent } from '@/lib/google-calendar'
import { auth } from '@/lib/firebase'
import { EventBannerThumb } from '@/components/events/event-banner-thumb'

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

function formatLocationDisplay(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) return 'Location TBA'
  if (/^https?:\/\//i.test(trimmed)) return 'View map'
  return trimmed
}

export default function EventCard({ event, showActions = true }: EventCardProps) {
  const [adding, setAdding] = useState(false)
  const title = (typeof event.title === 'string' && event.title.trim()) || 'Untitled event'
  const description =
    typeof event.description === 'string' ? event.description.trim() : ''

  const priceLabel = getEventPriceCornerLabel(event)
  const host = hostFromEventDoc(event)
  const businessName = host?.businessName || ''
  const ownerName = host?.ownerName || ''
  const logoUrl = host?.businessLogoUrl || ''

  const start = toDate(event.startDate) || toDate(event.date)
  const timeLabel = getEventTimeRangeLabel(event as Parameters<typeof getEventTimeRangeLabel>[0])
  const locationLabel = formatLocationDisplay(
    getEventLocationLabel(event as Parameters<typeof getEventLocationLabel>[0])
  )
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
        : null
  const isFull = capacity != null && attending >= capacity

  const href = `/events/${event.id || event.slug || ''}`
  const datePart = start ? format(start, 'MMM d') : 'TBA'
  const whenLabel = timeLabel ? `${datePart} · ${timeLabel}` : datePart
  const attendeesLabel =
    capacity != null ? `${attending}/${capacity}` : `${attending} attending`
  const category =
    typeof event.category === 'string' && event.category.trim()
      ? event.category.replace(/-/g, ' ')
      : ''

  const calendarPayload = {
    id: typeof event.id === 'string' ? event.id : undefined,
    title,
    description,
    location: getEventLocationLabel(event as Parameters<typeof getEventLocationLabel>[0]),
    locationName: typeof event.locationName === 'string' ? event.locationName : undefined,
    locationAddress:
      typeof event.locationAddress === 'string' ? (event.locationAddress as string) : undefined,
    startDate: event.startDate,
    endDate: event.endDate,
    date: event.date,
    time: typeof event.time === 'string' ? event.time : undefined,
    startTime: typeof event.startTime === 'string' ? (event.startTime as string) : undefined,
    endTime: typeof event.endTime === 'string' ? event.endTime : undefined,
  }

  const handleAddToCalendar = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (adding) return
    setAdding(true)

    try {
      const user = auth.currentUser
      const eventId = typeof event.id === 'string' ? event.id : ''

      // Prefer Calendar API when signed in + Google connected
      if (user && eventId) {
        try {
          const token = await user.getIdToken()
          const res = await fetch('/api/calendar/google/create-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ eventId }),
          })
          const data = (await res.json().catch(() => ({}))) as {
            success?: boolean
            htmlLink?: string | null
            action?: string
          }

          if (res.ok && data.success) {
            if (data.htmlLink) {
              window.open(data.htmlLink, '_blank', 'noopener,noreferrer')
            }
            return
          }

          // Not connected — start OAuth, then also open template so they can still add now
          if (data.action === 'connect') {
            const state = encodeURIComponent(
              JSON.stringify({
                uid: user.uid,
                eventId,
                returnTo: typeof window !== 'undefined' ? window.location.href : '/events',
              })
            )
            const authRes = await fetch(`/api/calendar/google/auth-url?state=${state}`)
            const authData = (await authRes.json().catch(() => ({}))) as { authUrl?: string }
            if (authData.authUrl) {
              window.open(authData.authUrl, '_blank', 'noopener,noreferrer')
            }
          }
        } catch {
          /* fall through to Google Calendar template */
        }
      }

      // Everyone else (and API fallback): open Google Calendar with event prefilled
      openGoogleCalendarForEvent(calendarPayload)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[#e4e1da] overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition">
      <div className="relative w-full shrink-0">
        <EventBannerThumb event={event} title={title} size="md" rounded="rounded-none" />
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black text-white">
          {priceLabel}
        </div>
        {isFull ? (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black !text-white">
            Full
          </div>
        ) : category ? (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/70 text-white capitalize">
            {category}
          </div>
        ) : null}
      </div>

      <div className="p-2.5 flex flex-col gap-1 flex-1 min-w-0">
        {(logoUrl || businessName || ownerName) && (
          <div className="flex items-center gap-1.5 min-w-0">
            {logoUrl && businessName !== 'Admin' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-5 w-5 rounded-full object-cover border border-neutral-200 shrink-0"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-neutral-900 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                {(businessName || ownerName || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-[11px] font-medium text-neutral-600 truncate">
              {businessName === 'Admin' ? 'Admin' : businessName || ownerName || 'Host'}
            </p>
          </div>
        )}

        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{title}</h3>

        {description ? (
          <p className="text-[11px] text-neutral-600 line-clamp-2">{description}</p>
        ) : null}

        <div className="space-y-0.5 text-[11px] text-neutral-600">
          <div className="flex items-center gap-1 min-w-0">
            <Calendar size={11} className="shrink-0" />
            <span className="truncate">{whenLabel}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate min-w-0 flex-1">{locationLabel}</span>
            <span className="text-neutral-300 mx-0.5 shrink-0">·</span>
            <Users size={11} className="shrink-0" />
            <span className="truncate shrink-0">{attendeesLabel}</span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-1 mt-auto pt-1.5">
            <Link
              href={href}
              className="pb-compact-btn flex-1 inline-flex items-center justify-center h-7 px-2 rounded-md bg-black !text-white text-[11px] font-semibold hover:bg-neutral-800"
            >
              View Details
            </Link>
            <button
              type="button"
              onClick={handleAddToCalendar}
              disabled={adding}
              className="pb-compact-btn inline-flex items-center justify-center h-7 w-7 rounded-md bg-black !text-white hover:bg-neutral-800 disabled:opacity-60"
              title="Add to Google Calendar"
              aria-label="Add to Google Calendar"
            >
              <CalendarPlus size={12} className="text-white" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
