import type { EventTag, GenderRestriction } from '@/lib/types'
import type { EventStatus, PricingType } from '@/lib/event-types'

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

export function buildEventApiPayload(form: AdminEventFormInput) {
  const startDate = combineDateAndTime(form.date, form.startTime)
  const endDate = combineDateAndTime(form.date, form.endTime)

  const pricingType: PricingType = form.isPaid ? 'paid_by_pb' : 'free'
  const tags = [...form.tags]
  if (!form.isPaid && !tags.includes('free')) {
    tags.push('free')
  }

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category || inferCategory(tags, form.genderRestriction),
    tags,
    genderRestriction: form.genderRestriction,
    locationName: form.locationName.trim(),
    locationAddress: form.locationAddress.trim() || form.locationName.trim(),
    locationPlaceId: form.locationPlaceId || '',
    locationLat: form.locationLat || 0,
    locationLng: form.locationLng || 0,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    timezone: 'Asia/Dubai',
    pricingType,
    price: form.isPaid ? form.price : null,
    currency: form.currency || 'AED',
    revenueModel: form.isPaid ? 'pb_full' : null,
    paymentGateway: form.isPaid ? form.paymentGateway || 'stripe' : null,
    bannerURL: form.bannerURL || '',
    maxAttendees: form.maxAttendees ?? null,
    status: form.status as EventStatus,
    createdBy: form.createdBy || 'admin',
    createdByRole: form.createdByRole || 'admin',
  }
}
