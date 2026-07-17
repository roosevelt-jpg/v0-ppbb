import { Timestamp } from 'firebase/firestore'

export type GenderRestriction = 'mixed' | 'men-only' | 'ladies-only'
export type EventStatus =
  | 'draft'
  | 'pending_approval'
  | 'changes_requested'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'completed'
export type PricingType = 'free' | 'paid_by_business' | 'paid_by_pb' | 'premium' | 'member_only'
export type RevenueModel = 'business_split' | 'pb_full' | null
export type PayoutStatus = 'not_applicable' | 'pending' | 'processing' | 'paid_out'

export type RegistrationStatus =
  | 'confirmed'
  | 'pending'
  | 'waitlisted'
  | 'cancelled'
  | 'rejected'

export type RecurrenceFrequency = 'weekly' | 'monthly'

export interface Speaker {
  name: string
  title?: string
  bio?: string
  photoURL?: string
  link?: string | null
}

export interface AgendaItem {
  time: string
  title: string
  description?: string | null
  speakerName?: string | null
  durationMinutes?: number | null
  order: number
}

export interface EventLocation {
  address: string
  city?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  placeId?: string
}

/** Luma-style ticket tier */
export interface TicketType {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  capacity?: number | null
  soldCount: number
  requireApproval: boolean
  isActive: boolean
}

export interface EventCoupon {
  code: string
  percentOff?: number | null
  amountOff?: number | null
  maxRedemptions?: number | null
  usedCount: number
  ticketTypeIds?: string[] | null
}

export interface EventRecurrence {
  frequency: RecurrenceFrequency
  interval: number
  until?: string | null
  /** When editing one occurrence, push shared fields to future series events */
  applyChangesToFuture?: boolean
}

export interface Event {
  id?: string
  title: string
  description: string
  category: string
  tags: string[]
  genderRestriction: GenderRestriction
  isFeatured: boolean

  speakers: Speaker[]
  agenda: AgendaItem[]

  locationName: string
  locationAddress: string
  locationPlaceId: string
  locationLat: number
  locationLng: number

  startDate: Timestamp | Date
  endDate: Timestamp | Date
  timezone: string

  pricingType: PricingType
  price: number | null
  currency: string | null
  revenueModel: RevenueModel
  pbCommissionPercent: number | null
  businessPayoutPercent: number | null
  pbCommissionOverride: boolean
  paymentGateway: string | null

  /** Luma-parity hosting fields */
  ticketTypes: TicketType[]
  coupons: EventCoupon[]
  requireApproval: boolean
  enableWaitlist: boolean
  waitlistCount: number
  cohostIds: string[]
  cohostEmails: string[]
  shareSlug?: string | null
  recurrence?: EventRecurrence | null
  seriesId?: string | null
  showGuestList: boolean

  bannerURL: string
  /** Optional photo gallery for past / event images (slideshow beside content) */
  galleryURLs?: string[]
  maxAttendees: number | null
  currentAttendees: number

  totalRevenue: number
  pbRevenue: number
  businessRevenue: number
  payoutStatus: PayoutStatus
  payoutReference: string | null
  payoutDate: Timestamp | null

  status: EventStatus
  publishedAt: Timestamp | null
  cancelledAt: Timestamp | null
  cancelReason: string | null

  createdBy: string
  createdByRole: 'admin' | 'business'
  submittedAt: Timestamp | null
  approvedBy: string | null
  approvedAt: Timestamp | null
  approvalNotes: string | null
  lastEditedBy: string | null
  lastEditedAt: Timestamp | null
  editHistory: Array<{
    editedBy: string
    editedAt: Timestamp | Date
    changedFields: string[]
  }>

  calendarEventId: string | null

  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface EventRegistration {
  id?: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  userGender: string
  registeredAt: Timestamp | Date
  status: RegistrationStatus
  cancelledAt: Timestamp | null
  cancellationReason: string | null

  ticketTypeId?: string | null
  ticketTypeName?: string | null
  waitlistPosition?: number | null
  checkInCode?: string | null
  qrToken?: string | null
  checkedInAt?: Timestamp | Date | null
  checkedInBy?: string | null
  inviteStatus?: 'invited' | 'added' | 'self' | null
  couponCode?: string | null
  referralCode?: string | null

  paymentStatus: 'free' | 'paid' | 'pending' | 'refunded' | null
  amountPaid: number | null
  currency: string | null
  pbCut: number | null
  businessCut: number | null
  paymentReference: string | null
  paymentGateway: string | null
  paidAt: Timestamp | null
  refundedAt: Timestamp | null
  refundReference: string | null
  stripeSessionId?: string | null

  calendarSynced: boolean
  calendarEventId: string | null
}

export interface Payout {
  id?: string
  businessId: string
  businessName: string
  eventId: string
  eventTitle: string
  amount: number
  currency: string
  payoutMethod: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  initiatedBy: string
  initiatedAt: Timestamp | Date
  completedAt: Timestamp | null
  payoutReference: string | null
  notes: string | null
}

export interface EventAttendance {
  id?: string
  eventId: string
  userId: string
  status: 'attending' | 'declined'
  addedToCalendar?: boolean
  calendarProvider?: 'google' | 'microsoft' | 'apple'
  createdAt: Timestamp | Date
}

export interface CalendarIntegration {
  provider: 'google' | 'microsoft' | 'apple'
  userId: string
  accessToken: string
  refreshToken?: string
  expiresAt: Timestamp | Date
}

export function createDefaultTicketType(
  price = 0,
  currency = 'AED',
  name = 'General Admission'
): TicketType {
  return {
    id: `tt_${Date.now().toString(36)}`,
    name,
    description: '',
    price,
    currency,
    capacity: null,
    soldCount: 0,
    requireApproval: false,
    isActive: true,
  }
}
