import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { isCharityVolunteerEvent } from '@/lib/charity-event'
import {
  ensureCheckInCodes,
  generateCheckInCode,
  generateQrToken,
} from '@/lib/event-luma-server'
import { creditVolunteerHoursForEventAttendance } from '@/lib/volunteer-hours-from-event'
import { addUserNotification } from '@/lib/in-app-notifications'

export type DoorScanResult = {
  success: true
  alreadyCheckedIn: boolean
  registrationId: string
  eventId: string
  eventTitle: string
  userName: string
  payment: 'confirmed_now' | 'already_paid' | 'free'
  attendance: 'checked_in' | 'already_in'
  volunteerHours: number | null
  volunteerNote: string | null
}

function moneyLabel(amount: number, currency: string): string {
  const value = Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
  return `${currency} ${value}`
}

/**
 * Admin door scan: confirms payment (when it was still due), marks attendance,
 * and starts volunteer-hour credit for charity / Thursday volunteering.
 */
export async function confirmDoorScan(opts: {
  registrationId: string
  adminUid: string
  expectedEventId?: string
}): Promise<DoorScanResult> {
  const db = getAdminDb()
  const ref = db.collection('eventRegistrations').doc(opts.registrationId)
  const snap = await ref.get()
  if (!snap.exists) throw new Error('Registration not found')
  let data = await ensureCheckInCodes(ref, snap.data() || {})
  const eventId = String(data.eventId || '')
  if (opts.expectedEventId && eventId !== opts.expectedEventId) {
    throw new Error('This code is for a different event')
  }
  const status = String(data.status || '')
  if (status === 'cancelled' || status === 'rejected' || status === 'waitlisted') {
    throw new Error(`Cannot check in a ${status.replace('_', ' ')} guest`)
  }

  const eventSnap = await db.collection('events').doc(eventId).get()
  if (!eventSnap.exists) throw new Error('Event not found')
  const event = (eventSnap.data() || {}) as Record<string, unknown>
  const eventTitle = String(event.title || 'Event')
  const userName = String(data.userName || data.userEmail || 'Guest')

  const pay = String(data.paymentStatus || '')
  const amount = Number(data.ticketPrice) || Number(data.amountPaid) || 0
  const currency = String(data.currency || event.currency || 'AED').toUpperCase()
  const owesMoney = pay === 'pending' || pay === 'pending_host' || status === 'pending_payment'
  let payment: DoorScanResult['payment'] = amount > 0 && pay === 'paid' ? 'already_paid' : 'free'

  if (owesMoney && amount > 0 && pay !== 'paid') {
    const wasConfirmed = status === 'confirmed'
    await ref.update({
      status: 'confirmed',
      paymentStatus: 'paid',
      paidAt: Timestamp.now(),
      amountPaid: amount,
      checkInCode: data.checkInCode || generateCheckInCode(),
      qrToken: data.qrToken || generateQrToken(),
      paymentGateway: data.paymentGateway || 'door_scan',
      paymentReference: `door_scan_${Date.now()}`,
    })
    if (!wasConfirmed && data.attendeeCounted !== true) {
      await db.collection('events').doc(eventId).update({
        currentAttendees: FieldValue.increment(1),
        totalRevenue: FieldValue.increment(amount),
        updatedAt: Timestamp.now(),
      })
    }
    payment = 'confirmed_now'
    data = { ...data, status: 'confirmed', paymentStatus: 'paid', amountPaid: amount }
  } else if (status !== 'confirmed') {
    await ref.update({ status: 'confirmed', attendeeCounted: true, updatedAt: Timestamp.now() })
    if (data.attendeeCounted !== true) {
      await db
        .collection('events')
        .doc(eventId)
        .update({ currentAttendees: FieldValue.increment(1), updatedAt: Timestamp.now() })
    }
    data = { ...data, status: 'confirmed' }
  }

  const alreadyCheckedIn = Boolean(data.checkedInAt)
  if (!alreadyCheckedIn) {
    await ref.update({ checkedInAt: Timestamp.now(), checkedInBy: opts.adminUid })
    await db.collection('events').doc(eventId).update({
      checkedInCount: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    })
  }

  let volunteerHours: number | null = null
  let volunteerNote: string | null = null
  const userId = typeof data.userId === 'string' ? data.userId : ''
  if (userId && isCharityVolunteerEvent(event)) {
    const credit = await creditVolunteerHoursForEventAttendance({
      eventId,
      event,
      registrationId: opts.registrationId,
      userId,
    })
    if (credit.hours > 0) {
      volunteerHours = credit.hours
      const certLine =
        credit.certificatesIssued && credit.certificatesIssued.length > 0
          ? ' A volunteer certificate was issued because they reached the hours required.'
          : ''
      volunteerNote =
        credit.reason === 'already_credited'
          ? `${credit.hours} volunteer hours were already counted for this day.${certLine}`
          : `${credit.hours} volunteer hours recorded for attending today.${certLine}`
    } else if (credit.reason === 'no_duration') {
      volunteerNote =
        'Attendance confirmed. Add a start and end time on this event so volunteer hours can be counted.'
    }
  }

  if (userId && !alreadyCheckedIn) {
    const parts = [`Checked in at ${eventTitle}.`]
    if (payment === 'confirmed_now') {
      parts.push(`Payment of ${moneyLabel(amount, currency)} was confirmed at the door.`)
    } else if (payment === 'already_paid') {
      parts.push(`Payment of ${moneyLabel(Number(data.amountPaid) || amount, currency)} was already received.`)
    }
    if (volunteerNote) parts.push(volunteerNote)
    const message = parts.join(' ')
    void addUserNotification(userId, {
      title: payment === 'confirmed_now' ? 'Payment and attendance confirmed' : 'Attendance confirmed',
      message,
      href: `/events/${eventId}/confirmation?registrationId=${opts.registrationId}`,
      type: 'event_check_in',
    }).catch(() => undefined)
    void import('@/lib/push-notifications-server').then(({ pushToUserSafe }) => {
      pushToUserSafe(userId, { title: 'Attendance confirmed', body: message }, {
        type: 'event_check_in',
        click_action: `/events/${eventId}`,
      })
    })
  }

  return {
    success: true,
    alreadyCheckedIn,
    registrationId: opts.registrationId,
    eventId,
    eventTitle,
    userName,
    payment,
    attendance: alreadyCheckedIn ? 'already_in' : 'checked_in',
    volunteerHours,
    volunteerNote,
  }
}
