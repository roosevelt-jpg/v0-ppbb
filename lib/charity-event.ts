/** Shared charity / volunteer event detection (client + server safe). */

function eventText(event: {
  category?: unknown
  tags?: unknown
  eventType?: unknown
  title?: unknown
}): string {
  const tags = Array.isArray(event.tags) ? event.tags.map((t) => String(t)) : []
  return [event.category, event.eventType, event.title, ...tags].join(' ').toLowerCase()
}

function isThursdayInDubai(value: unknown): boolean {
  if (!value) return false
  const date =
    value instanceof Date
      ? value
      : typeof value === 'object' && value !== null && 'toDate' in value
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string | number)
  if (Number.isNaN(date.getTime())) return false
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    weekday: 'long',
  }).format(date)
  return weekday === 'Thursday'
}

/** Charity drives and Thursday volunteering (vest distribution, hours traced). */
export function isCharityVolunteerEvent(event: {
  category?: unknown
  tags?: unknown
  eventType?: unknown
  title?: unknown
  startDate?: unknown
  date?: unknown
  trackVolunteerHours?: unknown
}): boolean {
  if (event.trackVolunteerHours === true) return true
  const text = eventText(event)
  const volunteerish =
    /charity|fundraiser|volunteer|volunteering|distribution|vest/.test(text)
  if (volunteerish) return true
  const thursday =
    text.includes('thursday') || isThursdayInDubai(event.startDate || event.date)
  return thursday && /volunteer|distribution|vest|charity/.test(text)
}
