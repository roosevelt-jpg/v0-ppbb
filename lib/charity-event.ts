/** Shared charity / volunteer event detection (client + server safe). */

export function isCharityVolunteerEvent(event: {
  category?: unknown
  tags?: unknown
  eventType?: unknown
}): boolean {
  const category = String(event.category || '').toLowerCase()
  const eventType = String(event.eventType || '').toLowerCase()
  const tags = Array.isArray(event.tags)
    ? event.tags.map((t) => String(t).toLowerCase())
    : []
  return (
    category === 'charity' ||
    category.includes('charity') ||
    eventType === 'charity' ||
    eventType === 'fundraiser' ||
    tags.includes('charity') ||
    tags.includes('fundraiser') ||
    tags.includes('volunteer')
  )
}
