import type { EventTag, GenderRestriction } from '@/lib/types'
import type {
  EventCoupon,
  EventRecurrence,
  EventStatus,
  PricingType,
  TicketType,
} from '@/lib/event-types'
import { createDefaultTicketType } from '@/lib/event-types'

export interface AdminEventFormInput {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  locationName: string
  locationAddress: string
  locationPlaceId: string
  locationLat: number
  locationLng: number
  bannerURL: string
  isPaid: boolean
  price: number
  currency: string
  paymentGateway?: 'stripe' | 'paypal' | 'ziina'
  maxAttendees?: number
  status: 'draft' | 'published'
  genderRestriction: GenderRestriction
  tags: EventTag[]
  category?: string
  createdBy?: string
  createdByRole?: 'admin' | 'business'
  speakers?: Array<{
    name: string
    title?: string
    bio?: string
    photoURL?: string
    link?: string | null
  }>
  agenda?: Array<{
    time: string
    title: string
    description?: string | null
    speakerName?: string | null
    durationMinutes?: number | null
    order: number
  }>
  ticketTypes?: TicketType[]
  coupons?: EventCoupon[]
  requireApproval?: boolean
  enableWaitlist?: boolean
  cohostIds?: string[]
  cohostEmails?: string[]
  showGuestList?: boolean
  isFeatured?: boolean
  recurrence?: EventRecurrence | null
}

function combineDateAndTime(date: string, time: string): Date {
  const safeTime = time && /^\d{2}:\d{2}/.test(time) ? time : '00:00'
  return new Date(`${date}T${safeTime}:00`)
}

function inferCategory(tags: EventTag[], genderRestriction: GenderRestriction): string {
  if (tags.includes('workshop')) return 'workshop'
  if (tags.includes('fundraiser')) return 'charity'
  if (genderRestriction === 'ladies-only') return 'sisters'
  if (genderRestriction === 'men-only') return 'brothers'
  return 'mixed'
}

function normalizeTicketTypes(
  form: AdminEventFormInput
): TicketType[] {
  if (Array.isArray(form.ticketTypes) && form.ticketTypes.length > 0) {
    return form.ticketTypes.map((t) => ({
      ...t,
      id: t.id || `tt_${Math.random().toString(36).slice(2, 9)}`,
      soldCount: typeof t.soldCount === 'number' ? t.soldCount : 0,
      isActive: t.isActive !== false,
      // Approval is event-level only; do not keep stale per-ticket flags
      requireApproval: false,
      currency: t.currency || form.currency || 'AED',
    }))
  }
  return [
    createDefaultTicketType(
      form.isPaid ? form.price : 0,
      form.currency || 'AED',
      form.isPaid ? 'Paid Ticket' : 'General Admission'
    ),
  ]
}

export function buildEventApiPayload(form: AdminEventFormInput) {
  const startDate = combineDateAndTime(form.date, form.startTime)
  const endDate = combineDateAndTime(form.date, form.endTime)

  const pricingType: PricingType = form.isPaid ? 'paid_by_pb' : 'free'
  const tags = [...form.tags]
  if (!form.isPaid && !tags.includes('free')) {
    tags.push('free')
  }

  const ticketTypes = normalizeTicketTypes(form)
  const primaryPrice = form.isPaid
    ? ticketTypes[0]?.price ?? form.price
    : 0

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category || inferCategory(tags, form.genderRestriction),
    tags,
    genderRestriction: form.genderRestriction,
    isFeatured: Boolean(form.isFeatured),
    speakers: form.speakers || [],
    agenda: form.agenda || [],
    locationName: form.locationName.trim(),
    locationAddress: form.locationAddress.trim() || form.locationName.trim(),
    locationPlaceId: form.locationPlaceId || '',
    locationLat: form.locationLat || 0,
    locationLng: form.locationLng || 0,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    timezone: 'Asia/Dubai',
    pricingType,
    price: form.isPaid ? primaryPrice : null,
    currency: form.currency || 'AED',
    revenueModel: form.isPaid ? 'pb_full' : null,
    paymentGateway: form.isPaid ? form.paymentGateway || 'stripe' : null,
    bannerURL: form.bannerURL || '',
    maxAttendees: form.maxAttendees ?? null,
    status: form.status as EventStatus,
    createdBy: form.createdBy || 'admin',
    createdByRole: form.createdByRole || 'admin',
    ticketTypes,
    coupons: Array.isArray(form.coupons) ? form.coupons : [],
    requireApproval: Boolean(form.requireApproval),
    enableWaitlist: Boolean(form.enableWaitlist),
    waitlistCount: 0,
    cohostIds: form.cohostIds || [],
    cohostEmails: form.cohostEmails || [],
    showGuestList: form.showGuestList !== false,
    recurrence: form.recurrence || null,
    seriesId: null,
  }
}

/** Fields safe to PUT when editing — excludes createdAt / createdBy / createdByRole. */
export function buildEventUpdatePayload(form: AdminEventFormInput) {
  const { createdBy: _createdBy, createdByRole: _createdByRole, waitlistCount: _w, seriesId: _s, ...rest } =
    buildEventApiPayload(form)
  return rest
}

function padTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function extractDateParts(value: unknown): { date: string; time: string } {
  const fallback = { date: formatLocalDate(new Date()), time: '09:00' }
  if (!value) return fallback
  const d =
    value instanceof Date
      ? value
      : typeof value === 'object' && value !== null && 'toDate' in value
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string)
  if (Number.isNaN(d.getTime())) return fallback
  return {
    date: formatLocalDate(d),
    time: padTime(d.getHours(), d.getMinutes()),
  }
}

export function mapEventDocToAdminForm(
  data: Record<string, unknown>
): AdminEventFormInput & { approvalNotes?: string | null; existingStatus?: EventStatus } {
  const start = extractDateParts(data.startDate ?? data.date)
  const end = extractDateParts(data.endDate ?? data.startDate ?? data.date)
  const pricingType = (data.pricingType as string) || 'free'
  const isPaid = pricingType !== 'free' && pricingType !== 'member_only'
  const gender =
    data.genderRestriction === 'ladies-only' ||
    data.genderRestriction === 'men-only' ||
    data.genderRestriction === 'mixed'
      ? (data.genderRestriction as GenderRestriction)
      : 'mixed'
  const tags = Array.isArray(data.tags)
    ? (data.tags.filter((t): t is EventTag => typeof t === 'string') as EventTag[])
    : []

  const gateway = data.paymentGateway
  const paymentGateway =
    gateway === 'stripe' || gateway === 'paypal' || gateway === 'ziina' ? gateway : 'stripe'

  return {
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    date: start.date,
    startTime: typeof data.startTime === 'string' && data.startTime ? data.startTime : start.time,
    endTime: typeof data.endTime === 'string' && data.endTime ? data.endTime : end.time,
    locationName:
      (typeof data.locationName === 'string' && data.locationName) ||
      (typeof data.location === 'string' && data.location) ||
      '',
    locationAddress:
      (typeof data.locationAddress === 'string' && data.locationAddress) ||
      (typeof data.locationName === 'string' && data.locationName) ||
      '',
    locationPlaceId: typeof data.locationPlaceId === 'string' ? data.locationPlaceId : '',
    locationLat: typeof data.locationLat === 'number' ? data.locationLat : 0,
    locationLng: typeof data.locationLng === 'number' ? data.locationLng : 0,
    bannerURL:
      (typeof data.bannerURL === 'string' && data.bannerURL) ||
      (typeof data.bannerImageUrl === 'string' && data.bannerImageUrl) ||
      '',
    isPaid,
    price: typeof data.price === 'number' ? data.price : 0,
    currency: typeof data.currency === 'string' ? data.currency : 'AED',
    paymentGateway,
    maxAttendees: typeof data.maxAttendees === 'number' ? data.maxAttendees : undefined,
    status: data.status === 'published' ? 'published' : 'draft',
    genderRestriction: gender,
    tags,
    category: typeof data.category === 'string' ? data.category : undefined,
    approvalNotes: typeof data.approvalNotes === 'string' ? data.approvalNotes : null,
    existingStatus: (data.status as EventStatus) || 'draft',
    speakers: Array.isArray(data.speakers) ? (data.speakers as AdminEventFormInput['speakers']) : [],
    agenda: Array.isArray(data.agenda) ? (data.agenda as AdminEventFormInput['agenda']) : [],
    ticketTypes: Array.isArray(data.ticketTypes) ? (data.ticketTypes as TicketType[]) : [],
    coupons: Array.isArray(data.coupons) ? (data.coupons as EventCoupon[]) : [],
    requireApproval: Boolean(data.requireApproval),
    enableWaitlist: Boolean(data.enableWaitlist),
    cohostIds: Array.isArray(data.cohostIds) ? (data.cohostIds as string[]) : [],
    cohostEmails: Array.isArray(data.cohostEmails) ? (data.cohostEmails as string[]) : [],
    showGuestList: data.showGuestList !== false,
    isFeatured: Boolean(data.isFeatured),
    recurrence: (data.recurrence as EventRecurrence) || null,
  }
}
