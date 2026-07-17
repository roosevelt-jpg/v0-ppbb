import {
  getEventEndDate,
  getEventLocationLabel,
  getEventStartDate,
} from '@/lib/event-utils'

export type CalendarEventInput = {
  id?: string
  title?: string
  description?: string
  location?: string
  locationName?: string
  locationAddress?: string
  startDate?: unknown
  endDate?: unknown
  date?: unknown
  time?: string
  startTime?: string
  endTime?: string
  timezone?: string
}

function applyClock(date: Date, clock: string): void {
  const [h, m] = clock.split(':')
  if (h == null) return
  date.setHours(parseInt(h, 10) || 0, parseInt(m || '0', 10) || 0, 0, 0)
}

/** Resolve start/end Date for calendar export (ICS / Google / API). */
export function resolveCalendarDateRange(event: CalendarEventInput): {
  start: Date
  end: Date
} {
  const start = new Date(getEventStartDate(event as never))
  let end = new Date(getEventEndDate(event as never))

  // Legacy docs store date + separate startTime/endTime strings
  if (!event.startDate && event.date) {
    const clock =
      (typeof event.startTime === 'string' && event.startTime) ||
      (typeof event.time === 'string' && event.time) ||
      ''
    if (clock.includes(':')) applyClock(start, clock)
  }

  if (typeof event.endTime === 'string' && event.endTime.includes(':')) {
    end = new Date(start)
    applyClock(end, event.endTime)
  } else if (end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  }

  return { start, end }
}

function toGoogleUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Google Calendar “add event” URL (TEMPLATE).
 * Opens Google Calendar with fields prefilled — user confirms Save.
 * Works for signed-out visitors; does not require OAuth.
 */
export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const { start, end } = resolveCalendarDateRange(event)
  const title = (event.title || 'Event').trim()
  const details = (event.description || '').trim()
  const location =
    (typeof event.location === 'string' && event.location.trim()) ||
    getEventLocationLabel(event as never)

  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', title)
  url.searchParams.set('dates', `${toGoogleUtcStamp(start)}/${toGoogleUtcStamp(end)}`)
  if (details) url.searchParams.set('details', details.slice(0, 8000))
  if (location && location !== 'Location TBA') {
    url.searchParams.set('location', location)
  }
  return url.toString()
}

/** Open Google Calendar add-event UI for this event. */
export function openGoogleCalendarForEvent(event: CalendarEventInput): void {
  if (typeof window === 'undefined') return
  window.open(buildGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer')
}
