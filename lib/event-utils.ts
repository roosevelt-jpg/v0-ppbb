import type { Timestamp } from 'firebase/firestore'
import type { Event, GenderRestriction, PricingType } from '@/lib/event-types'

export type EventsAudienceFilter = 'all' | 'sisters' | 'brothers' | 'mixed' | 'family'

/** Category filter id from CMS (`all` or a category id). */
export type EventsCategoryFilter = string

export interface NormalizedEvent extends Event {
  id: string
  businessName?: string
  ownerName?: string
  businessLogoUrl?: string
}

export function toEventDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as Timestamp).toDate()
  }
  const parsed = new Date(value as string)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getEventStartDate(event: Partial<Event> & { date?: unknown }): Date {
  return (
    toEventDate(event.startDate) ||
    toEventDate(event.date) ||
    new Date()
  )
}

export function getEventEndDate(event: Partial<Event> & { date?: unknown }): Date {
  return toEventDate(event.endDate) || getEventStartDate(event)
}

export function getEventBannerURL(data: Record<string, unknown>): string {
  const url =
    (typeof data.bannerURL === 'string' && data.bannerURL) ||
    (typeof data.bannerImage === 'string' && data.bannerImage) ||
    (typeof data.bannerImageUrl === 'string' && data.bannerImageUrl) ||
    ''
  return url
}

export function getEventTimeLabel(event: Partial<Event> & { time?: string; startTime?: string }): string {
  if (typeof event.time === 'string' && event.time) return event.time
  if (typeof event.startTime === 'string' && event.startTime) return event.startTime
  const start = getEventStartDate(event)
  return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatTimeOfDay(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** Start–end range when end differs from start; otherwise start only. */
export function getEventTimeRangeLabel(
  event: Partial<Event> & { time?: string; startTime?: string; endTime?: string }
): string {
  const start = getEventStartDate(event)
  const end = getEventEndDate(event)

  let startLabel = ''
  if (typeof event.startTime === 'string' && event.startTime.trim()) {
    startLabel = event.startTime.trim()
  } else if (typeof event.time === 'string' && event.time.trim()) {
    startLabel = event.time.trim()
  } else {
    startLabel = formatTimeOfDay(start)
  }

  let endLabel = ''
  if (typeof event.endTime === 'string' && event.endTime.trim()) {
    endLabel = event.endTime.trim()
  } else if (end.getTime() !== start.getTime()) {
    endLabel = formatTimeOfDay(end)
  }

  if (endLabel && endLabel !== startLabel) {
    return `${startLabel} – ${endLabel}`
  }
  return startLabel
}

/** True when a string is a Maps/web URL rather than a human-readable address. */
export function isMapsOrWebUrl(value: string): boolean {
  const t = value.trim().toLowerCase()
  if (!t) return false
  return (
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.includes('maps.google.') ||
    t.includes('google.com/maps') ||
    t.includes('maps.app.goo.gl') ||
    t.includes('goo.gl/maps')
  )
}

/**
 * Prefer a human-readable address over pasted Google Maps links.
 * Order: non-URL address → non-URL name → non-URL location → TBA.
 */
export function getEventLocationLabel(event: Partial<Event> & { location?: string }): string {
  const candidates = [
    typeof event.locationAddress === 'string' ? event.locationAddress.trim() : '',
    typeof event.locationName === 'string' ? event.locationName.trim() : '',
    typeof event.location === 'string' ? event.location.trim() : '',
  ].filter(Boolean)

  const human = candidates.find((c) => !isMapsOrWebUrl(c))
  if (human) return human
  return 'Location TBA'
}

export function mapEventDoc(id: string, data: Record<string, unknown>): NormalizedEvent {
  const gender =
    data.genderRestriction === 'ladies-only' ||
    data.genderRestriction === 'men-only' ||
    data.genderRestriction === 'mixed'
      ? (data.genderRestriction as GenderRestriction)
      : 'mixed'

  const pricingType = (data.pricingType as PricingType) || 'free'
  const tags = Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === 'string') : []

  return {
    id,
    title: typeof data.title === 'string' ? data.title : 'Untitled event',
    description: typeof data.description === 'string' ? data.description : '',
    category: typeof data.category === 'string' ? data.category : 'general',
    tags,
    genderRestriction: gender,
    isFeatured: data.isFeatured === true,
    speakers: Array.isArray(data.speakers) ? (data.speakers as Event['speakers']) : [],
    agenda: Array.isArray(data.agenda) ? (data.agenda as Event['agenda']) : [],
    locationName: getEventLocationLabel(data as Partial<Event>),
    locationAddress: (() => {
      const raw = typeof data.locationAddress === 'string' ? data.locationAddress.trim() : ''
      if (raw && !isMapsOrWebUrl(raw)) return raw
      return getEventLocationLabel(data as Partial<Event>)
    })(),
    locationPlaceId: typeof data.locationPlaceId === 'string' ? data.locationPlaceId : '',
    locationLat: typeof data.locationLat === 'number' ? data.locationLat : 0,
    locationLng: typeof data.locationLng === 'number' ? data.locationLng : 0,
    businessName:
      data.createdByRole === 'admin'
        ? 'Admin'
        : typeof data.businessName === 'string'
          ? data.businessName
          : undefined,
    ownerName:
      data.createdByRole === 'admin'
        ? ''
        : typeof data.ownerName === 'string'
          ? data.ownerName
          : undefined,
    businessLogoUrl:
      typeof data.businessLogoUrl === 'string'
        ? data.businessLogoUrl
        : typeof data.businessLogoURL === 'string'
          ? data.businessLogoURL
          : undefined,
    startDate: getEventStartDate(data as Partial<Event>),
    endDate: getEventEndDate(data as Partial<Event>),
    timezone: typeof data.timezone === 'string' ? data.timezone : 'Asia/Dubai',
    pricingType,
    price: typeof data.price === 'number' ? data.price : null,
    currency: typeof data.currency === 'string' ? data.currency : 'AED',
    revenueModel: (data.revenueModel as Event['revenueModel']) ?? null,
    pbCommissionPercent: typeof data.pbCommissionPercent === 'number' ? data.pbCommissionPercent : null,
    businessPayoutPercent: typeof data.businessPayoutPercent === 'number' ? data.businessPayoutPercent : null,
    pbCommissionOverride: data.pbCommissionOverride === true,
    paymentGateway: typeof data.paymentGateway === 'string' ? data.paymentGateway : null,
    bannerURL: getEventBannerURL(data),
    maxAttendees: typeof data.maxAttendees === 'number' ? data.maxAttendees : null,
    currentAttendees: typeof data.currentAttendees === 'number' ? data.currentAttendees : 0,
    totalRevenue: typeof data.totalRevenue === 'number' ? data.totalRevenue : 0,
    pbRevenue: typeof data.pbRevenue === 'number' ? data.pbRevenue : 0,
    businessRevenue: typeof data.businessRevenue === 'number' ? data.businessRevenue : 0,
    payoutStatus: (data.payoutStatus as Event['payoutStatus']) || 'not_applicable',
    payoutReference: typeof data.payoutReference === 'string' ? data.payoutReference : null,
    payoutDate: toEventDate(data.payoutDate),
    status: (data.status as Event['status']) || 'draft',
    publishedAt: toEventDate(data.publishedAt),
    cancelledAt: toEventDate(data.cancelledAt),
    cancelReason: typeof data.cancelReason === 'string' ? data.cancelReason : null,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    createdByRole: data.createdByRole === 'business' ? 'business' : 'admin',
    submittedAt: toEventDate(data.submittedAt),
    approvedBy: typeof data.approvedBy === 'string' ? data.approvedBy : null,
    approvedAt: toEventDate(data.approvedAt),
    approvalNotes: typeof data.approvalNotes === 'string' ? data.approvalNotes : null,
    lastEditedBy: typeof data.lastEditedBy === 'string' ? data.lastEditedBy : null,
    lastEditedAt: toEventDate(data.lastEditedAt),
    editHistory: Array.isArray(data.editHistory) ? (data.editHistory as Event['editHistory']) : [],
    calendarEventId: typeof data.calendarEventId === 'string' ? data.calendarEventId : null,
    createdAt: toEventDate(data.createdAt) || new Date(),
    updatedAt: toEventDate(data.updatedAt) || new Date(),
  }
}

export function matchesAudienceFilter(
  event: NormalizedEvent,
  filter: EventsAudienceFilter
): boolean {
  if (filter === 'all') return true
  if (filter === 'sisters') return event.genderRestriction === 'ladies-only'
  if (filter === 'brothers') return event.genderRestriction === 'men-only'
  if (filter === 'mixed') return event.genderRestriction === 'mixed'
  if (filter === 'family') {
    return (
      event.category.toLowerCase() === 'family' ||
      event.tags.some((t) => t.toLowerCase() === 'family')
    )
  }
  return true
}

/** Match event against CMS category filter tab. */
export function matchesCategoryFilter(
  event: NormalizedEvent,
  filter: EventsCategoryFilter
): boolean {
  if (!filter || filter === 'all') return true
  const needle = filter.trim().toLowerCase()
  if (!needle) return true
  if (event.category.toLowerCase() === needle) return true
  return event.tags.some((t) => t.toLowerCase() === needle)
}

export function isSameMonth(date: Date, month: Date): boolean {
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth()
}

export function formatPricingLabel(event: NormalizedEvent): string {
  switch (event.pricingType) {
    case 'free':
      return 'Free'
    case 'member_only':
      return 'Members only'
    case 'premium':
      return event.price != null ? `${event.currency || 'AED'} ${event.price}` : 'Premium'
    case 'paid_by_business':
    case 'paid_by_pb':
      return event.price != null ? `${event.currency || 'AED'} ${event.price}` : 'Paid'
    default:
      return 'Free'
  }
}

export function getGenderBadgeLabel(restriction: GenderRestriction): string {
  switch (restriction) {
    case 'ladies-only':
      return 'Sisters'
    case 'men-only':
      return 'Brothers'
    default:
      return 'Mixed'
  }
}
