import { randomBytes, randomUUID } from 'crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { isAdminUser, verifyIdToken } from '@/lib/admin-access-server'
import type {
  EventCoupon,
  EventRecurrence,
  RegistrationStatus,
  TicketType,
} from '@/lib/event-types'

export async function resolveCohostIds(emails: string[]): Promise<string[]> {
  if (!emails.length) return []
  const db = getAdminDb()
  const ids: string[] = []
  for (const email of emails.slice(0, 20)) {
    const snap = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get()
    if (!snap.empty) ids.push(snap.docs[0].id)
  }
  return ids
}

export function generateCheckInCode(): string {
  return randomBytes(3).toString('hex').toUpperCase()
}

export function generateQrToken(): string {
  return randomUUID().replace(/-/g, '')
}

export function resolveTicketType(
  event: Record<string, unknown>,
  ticketTypeId?: string | null
): TicketType | null {
  const types = Array.isArray(event.ticketTypes) ? (event.ticketTypes as TicketType[]) : []
  const active = types.filter((t) => t.isActive !== false)
  if (active.length === 0) {
    const price = typeof event.price === 'number' ? event.price : 0
    const currency = typeof event.currency === 'string' ? event.currency : 'AED'
    return {
      id: 'legacy',
      name: price > 0 ? 'Paid Ticket' : 'General Admission',
      price,
      currency,
      soldCount: typeof event.currentAttendees === 'number' ? event.currentAttendees : 0,
      requireApproval: Boolean(event.requireApproval),
      isActive: true,
      capacity: typeof event.maxAttendees === 'number' ? event.maxAttendees : null,
    }
  }
  if (ticketTypeId) {
    return active.find((t) => t.id === ticketTypeId) || null
  }
  return active[0]
}

export function applyCoupon(
  price: number,
  couponCode: string | undefined,
  coupons: EventCoupon[] | undefined,
  ticketTypeId?: string | null
): { price: number; coupon: EventCoupon | null; error?: string } {
  if (!couponCode?.trim()) return { price, coupon: null }
  const code = couponCode.trim().toUpperCase()
  const list = Array.isArray(coupons) ? coupons : []
  const coupon = list.find((c) => c.code?.toUpperCase() === code)
  if (!coupon) return { price, coupon: null, error: 'Invalid coupon code' }
  if (coupon.maxRedemptions != null && coupon.usedCount >= coupon.maxRedemptions) {
    return { price, coupon: null, error: 'Coupon has reached its redemption limit' }
  }
  if (
    Array.isArray(coupon.ticketTypeIds) &&
    coupon.ticketTypeIds.length > 0 &&
    ticketTypeId &&
    !coupon.ticketTypeIds.includes(ticketTypeId)
  ) {
    return { price, coupon: null, error: 'Coupon does not apply to this ticket type' }
  }
  let next = price
  if (coupon.percentOff) next = Math.max(0, price * (1 - coupon.percentOff / 100))
  if (coupon.amountOff) next = Math.max(0, next - coupon.amountOff)
  return { price: Math.round(next * 100) / 100, coupon }
}

export function isEventFull(event: Record<string, unknown>, ticket?: TicketType | null): boolean {
  if (ticket?.capacity != null && ticket.soldCount >= ticket.capacity) return true
  const max = event.maxAttendees
  const current = typeof event.currentAttendees === 'number' ? event.currentAttendees : 0
  if (typeof max === 'number' && max > 0 && current >= max) return true
  return false
}

export async function getAuthUidFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyIdToken(token)
}

export async function canManageEvent(
  uid: string,
  event: Record<string, unknown>
): Promise<boolean> {
  if (await isAdminUser(uid)) return true
  if (event.createdBy === uid) return true
  const cohosts = Array.isArray(event.cohostIds) ? (event.cohostIds as string[]) : []
  return cohosts.includes(uid)
}

export async function findExistingRegistration(eventId: string, userId: string) {
  const snap = await getAdminDb()
    .collection('eventRegistrations')
    .where('eventId', '==', eventId)
    .where('userId', '==', userId)
    .limit(5)
    .get()
  return snap.docs.find((d) => {
    const status = d.data().status
    return status !== 'cancelled' && status !== 'rejected'
  })
}

export async function nextWaitlistPosition(eventId: string): Promise<number> {
  const snap = await getAdminDb()
    .collection('eventRegistrations')
    .where('eventId', '==', eventId)
    .where('status', '==', 'waitlisted')
    .get()
  return snap.size + 1
}

export function buildRegistrationRecord(input: {
  eventId: string
  userId: string
  userName: string
  userEmail: string
  userGender?: string
  status: RegistrationStatus
  ticket: TicketType
  amountPaid: number
  paymentStatus: 'free' | 'paid' | 'pending' | 'refunded' | null
  pbCut: number
  businessCut: number
  currency: string
  paymentGateway?: string | null
  waitlistPosition?: number | null
  inviteStatus?: 'invited' | 'added' | 'self' | null
  couponCode?: string | null
  referralCode?: string | null
  checkInCode?: string | null
  qrToken?: string | null
}) {
  const needsCodes = input.status === 'confirmed' && input.paymentStatus !== 'pending'
  return {
    eventId: input.eventId,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    userGender: input.userGender || '',
    registeredAt: Timestamp.now(),
    status: input.status,
    cancelledAt: null,
    cancellationReason: null,
    ticketTypeId: input.ticket.id,
    ticketTypeName: input.ticket.name,
    waitlistPosition: input.waitlistPosition ?? null,
    checkInCode: input.checkInCode ?? (needsCodes ? generateCheckInCode() : null),
    qrToken: input.qrToken ?? (needsCodes ? generateQrToken() : null),
    checkedInAt: null,
    checkedInBy: null,
    inviteStatus: input.inviteStatus ?? 'self',
    couponCode: input.couponCode ?? null,
    referralCode: input.referralCode ?? null,
    paymentStatus: input.paymentStatus,
    amountPaid: input.amountPaid,
    currency: input.currency,
    pbCut: input.pbCut,
    businessCut: input.businessCut,
    paymentReference: null,
    paymentGateway: input.paymentGateway ?? null,
    paidAt: null,
    refundedAt: null,
    refundReference: null,
    stripeSessionId: null,
    calendarSynced: false,
    calendarEventId: null,
  }
}

export async function incrementTicketSold(eventId: string, ticketTypeId: string) {
  const ref = getAdminDb().collection('events').doc(eventId)
  const doc = await ref.get()
  if (!doc.exists) return
  const data = doc.data()!
  const types = Array.isArray(data.ticketTypes) ? [...data.ticketTypes] : []
  const idx = types.findIndex((t: TicketType) => t.id === ticketTypeId)
  if (idx >= 0) {
    types[idx] = { ...types[idx], soldCount: (types[idx].soldCount || 0) + 1 }
    await ref.update({ ticketTypes: types, updatedAt: Timestamp.now() })
  }
}

export async function incrementCouponUsed(eventId: string, code: string) {
  const ref = getAdminDb().collection('events').doc(eventId)
  const doc = await ref.get()
  if (!doc.exists) return
  const data = doc.data()!
  const coupons = Array.isArray(data.coupons) ? [...data.coupons] : []
  const idx = coupons.findIndex((c: EventCoupon) => c.code?.toUpperCase() === code.toUpperCase())
  if (idx >= 0) {
    coupons[idx] = { ...coupons[idx], usedCount: (coupons[idx].usedCount || 0) + 1 }
    await ref.update({ coupons, updatedAt: Timestamp.now() })
  }
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

/** Generate child events for a simple weekly/monthly series (excluding the parent). */
export async function generateRecurringEvents(
  parentId: string,
  parentData: Record<string, unknown>,
  recurrence: EventRecurrence
): Promise<string[]> {
  const db = getAdminDb()
  const seriesId = (parentData.seriesId as string) || parentId
  await db.collection('events').doc(parentId).update({ seriesId, recurrence })

  const start = parentData.startDate?.toDate
    ? (parentData.startDate as { toDate: () => Date }).toDate()
    : new Date(parentData.startDate as string)
  const end = parentData.endDate?.toDate
    ? (parentData.endDate as { toDate: () => Date }).toDate()
    : new Date(parentData.endDate as string)
  const duration = end.getTime() - start.getTime()
  const until = recurrence.until ? new Date(recurrence.until) : addMonths(start, 3)
  const interval = Math.max(1, recurrence.interval || 1)
  const created: string[] = []
  let cursor = new Date(start)
  let guard = 0

  while (guard < 52) {
    guard += 1
    cursor =
      recurrence.frequency === 'monthly'
        ? addMonths(cursor, interval)
        : addWeeks(cursor, interval)
    if (cursor > until) break

    const childStart = new Date(cursor)
    const childEnd = new Date(childStart.getTime() + duration)
    const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, ...rest } = parentData as any
    const payload = {
      ...rest,
      startDate: Timestamp.fromDate(childStart),
      endDate: Timestamp.fromDate(childEnd),
      seriesId,
      recurrence: null,
      currentAttendees: 0,
      waitlistCount: 0,
      totalRevenue: 0,
      pbRevenue: 0,
      businessRevenue: 0,
      ticketTypes: Array.isArray(rest.ticketTypes)
        ? rest.ticketTypes.map((t: TicketType) => ({ ...t, soldCount: 0 }))
        : [],
      coupons: Array.isArray(rest.coupons)
        ? rest.coupons.map((c: EventCoupon) => ({ ...c, usedCount: 0 }))
        : [],
      status: rest.status === 'published' ? 'published' : rest.status,
      publishedAt: rest.status === 'published' ? Timestamp.now() : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    const ref = await db.collection('events').add(payload)
    created.push(ref.id)
  }
  return created
}

export function registrationsToCsv(rows: Array<Record<string, unknown>>): string {
  const headers = [
    'id',
    'userName',
    'userEmail',
    'status',
    'ticketTypeName',
    'paymentStatus',
    'amountPaid',
    'checkInCode',
    'checkedInAt',
    'registeredAt',
  ]
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }
  return lines.join('\n')
}

export async function promoteNextWaitlisted(eventId: string): Promise<string | null> {
  const snap = await getAdminDb()
    .collection('eventRegistrations')
    .where('eventId', '==', eventId)
    .where('status', '==', 'waitlisted')
    .orderBy('waitlistPosition', 'asc')
    .limit(1)
    .get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const data = doc.data()
  const code = generateCheckInCode()
  const token = generateQrToken()
  await doc.ref.update({
    status: 'confirmed',
    waitlistPosition: null,
    checkInCode: code,
    qrToken: token,
    paymentStatus: data.paymentStatus === 'pending' ? 'pending' : data.paymentStatus || 'free',
  })
  await getAdminDb()
    .collection('events')
    .doc(eventId)
    .update({
      currentAttendees: FieldValue.increment(1),
      waitlistCount: FieldValue.increment(-1),
      updatedAt: Timestamp.now(),
    })

  if (data.userEmail) {
    const eventDoc = await getAdminDb().collection('events').doc(eventId).get()
    const eventTitle = String(eventDoc.data()?.title || 'Event')
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.passive-blessings.com'
    const { sendEventRegistrationEmail } = await import('@/lib/event-confirmation-email')
    void sendEventRegistrationEmail({
      to: String(data.userEmail),
      eventTitle,
      eventUrl: `${origin}/events/${eventId}`,
      status: 'confirmed',
      checkInCode: code,
    })
  }

  return doc.id
}
