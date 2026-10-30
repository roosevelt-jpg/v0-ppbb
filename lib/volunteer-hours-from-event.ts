import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { isCharityVolunteerEvent } from '@/lib/charity-event'

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    const seconds = Number((value as { _seconds: number })._seconds)
    if (!Number.isFinite(seconds)) return null
    const d = new Date(seconds * 1000)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value as string | number)
  return Number.isNaN(d.getTime()) ? null : d
}

function applyClock(date: Date, clock: string): Date {
  const match = clock.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return new Date(date)
  const next = new Date(date)
  next.setHours(parseInt(match[1], 10) || 0, parseInt(match[2], 10) || 0, 0, 0)
  return next
}

/**
 * Volunteer hours for an event = duration from start to end (not a flat per-event count).
 * Uses startDate/endDate plus startTime/endTime when those clock fields are stored separately.
 */
export function computeVolunteerHoursFromEvent(event: Record<string, unknown>): number {
  const startRaw = toDate(event.startDate) || toDate(event.date) || toDate(event.start)
  if (!startRaw) return 0

  const startClock =
    (typeof event.startTime === 'string' && event.startTime.trim()) ||
    (typeof event.time === 'string' && event.time.trim()) ||
    ''
  const start = startClock.includes(':') ? applyClock(startRaw, startClock) : new Date(startRaw)

  const endRaw = toDate(event.endDate) || toDate(event.end)
  const endClock = typeof event.endTime === 'string' ? event.endTime.trim() : ''

  let end: Date
  if (endClock.includes(':')) {
    const base = endRaw ? new Date(endRaw) : new Date(start)
    end = applyClock(base, endClock)
  } else if (endRaw) {
    end = new Date(endRaw)
  } else {
    return 0
  }

  // Overnight sessions (e.g. 22:00 → 01:00). Do not invent duration when start === end with no clocks.
  if (end.getTime() < start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
  } else if (end.getTime() === start.getTime()) {
    if (endClock.includes(':') && startClock.includes(':') && endClock !== startClock) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
    } else {
      return 0
    }
  }

  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  if (!Number.isFinite(hours) || hours <= 0) return 0

  // Single session sanity cap (avoids bad multi-day timestamp data)
  const capped = Math.min(hours, 24)
  return Math.round(capped * 4) / 4
}

function resolveVolunteerHours(event: Record<string, unknown>): { hours: number; source: string } {
  const computed = computeVolunteerHoursFromEvent(event)
  if (computed > 0) return { hours: computed, source: 'event_duration' }
  const explicit = Number(event.volunteerHours ?? event.volunteerHoursCredit)
  if (Number.isFinite(explicit) && explicit > 0) {
    return { hours: Math.min(Math.round(explicit * 4) / 4, 24), source: 'event_setting' }
  }
  // Thursday distributions are often saved with a start time and no end time.
  // A session still counts so registration itself can add hours.
  return { hours: 2, source: 'default_session' }
}

async function markRegistrationHours(registrationId: string, hours: number) {
  await getAdminDb().collection('eventRegistrations').doc(registrationId).set(
    {
      volunteerHoursCredited: true,
      volunteerHoursAmount: hours,
      volunteerHoursCreditedAt: Timestamp.now(),
    },
    { merge: true }
  )
}

/**
 * Credit volunteer hours toward certificates when a member registers for a
 * charity / Thursday distribution, or when staff scan them at the door.
 * Idempotent per registrationId. Scanning does not add the hours a second time.
 */
export async function creditVolunteerHoursForEventAttendance(opts: {
  eventId: string
  event: Record<string, unknown>
  registrationId: string
  userId: string
  source?: 'registration' | 'event_check_in'
}): Promise<{ credited: boolean; hours: number; reason?: string; adjusted?: boolean; certificatesIssued?: string[] }> {
  const { eventId, event, registrationId, userId } = opts
  if (!userId) return { credited: false, hours: 0, reason: 'no_user' }
  if (!isCharityVolunteerEvent(event)) {
    await markRegistrationHours(registrationId, 0)
    return { credited: false, hours: 0, reason: 'not_charity_event' }
  }

  const resolved = resolveVolunteerHours(event)
  const hours = resolved.hours
  if (hours <= 0) {
    return { credited: false, hours: 0, reason: 'no_duration' }
  }

  const db = getAdminDb()
  const existing = await db
    .collection('volunteerRecords')
    .where('userId', '==', userId)
    .where('registrationId', '==', registrationId)
    .limit(1)
    .get()

  if (!existing.empty) {
    const doc = existing.docs[0]
    const prevHours = Number(doc.data().hours || 0)
    const delta = Math.round((hours - prevHours) * 4) / 4
    if (delta === 0) {
      await markRegistrationHours(registrationId, prevHours)
      const certificatesIssued = await issueCertificates(userId)
      return { credited: false, hours: prevHours, reason: 'already_credited', certificatesIssued }
    }

    await doc.ref.update({
      hours,
      hoursSource: resolved.source,
      hoursCorrectedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    if (delta !== 0) {
      await db.collection('users').doc(userId).set(
        {
          volunteeredHours: FieldValue.increment(delta),
          volunteerHours: FieldValue.increment(delta),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )
    }

    await markRegistrationHours(registrationId, hours)
    const certificatesIssued = await issueCertificates(userId)
    return { credited: true, hours, reason: 'adjusted', adjusted: true, certificatesIssued }
  }

  const recordSource = opts.source === 'registration' ? 'registration' : 'event_check_in'
  await db.collection('volunteerRecords').add({
    userId,
    eventId,
    eventTitle: String(event.title || 'Charity event'),
    registrationId,
    hours,
    hoursSource: resolved.source,
    date: Timestamp.now(),
    description:
      recordSource === 'registration'
        ? `Registered for ${String(event.title || 'event')}`
        : `Attendance confirmed at ${String(event.title || 'event')}`,
    verified: true,
    source: recordSource,
    createdAt: Timestamp.now(),
  })

  await db.collection('users').doc(userId).set(
    {
      volunteeredHours: FieldValue.increment(hours),
      volunteerHours: FieldValue.increment(hours),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )

  await markRegistrationHours(registrationId, hours)
  const certificatesIssued = await issueCertificates(userId)
  return { credited: true, hours, certificatesIssued }
}

/** Add hours for every confirmed registration this member already has. */
export async function backfillVolunteerHoursForUser(userId: string): Promise<number> {
  if (!userId) return 0
  const db = getAdminDb()
  const regs = await db.collection('eventRegistrations').where('userId', '==', userId).get()
  let credited = 0
  for (const doc of regs.docs) {
    const data = doc.data()
    if (String(data.status || '') !== 'confirmed') continue
    if (data.volunteerHoursCredited === true) continue
    const eventId = String(data.eventId || '')
    if (!eventId) continue
    const eventSnap = await db.collection('events').doc(eventId).get()
    if (!eventSnap.exists) continue
    const result = await creditVolunteerHoursForEventAttendance({
      eventId,
      event: eventSnap.data() || {},
      registrationId: doc.id,
      userId,
      source: 'registration',
    })
    if (result.credited || result.reason === 'already_credited' || result.reason === 'not_charity_event') {
      credited += result.hours > 0 ? 1 : 0
    }
  }
  return credited
}

/** Walk confirmed registrations in pages so past members receive hours without opening the site. */
export async function backfillVolunteerHoursBatch(limit = 40): Promise<number> {
  const db = getAdminDb()
  const { FieldPath } = await import('firebase-admin/firestore')
  const stateRef = db.collection('platformState').doc('volunteerHoursBackfill')
  const state = await stateRef.get()
  const cursor = typeof state.data()?.lastId === 'string' ? state.data()?.lastId : ''
  let query = db.collection('eventRegistrations').orderBy(FieldPath.documentId()).limit(limit)
  if (cursor) query = query.startAfter(cursor)
  const snap = await query.get()
  let processed = 0
  let lastId = cursor
  for (const doc of snap.docs) {
    lastId = doc.id
    const data = doc.data()
    if (String(data.status || '') !== 'confirmed') continue
    if (data.volunteerHoursCredited === true) continue
    const userId = String(data.userId || '')
    const eventId = String(data.eventId || '')
    if (!userId || !eventId) {
      await markRegistrationHours(doc.id, 0)
      continue
    }
    const eventSnap = await db.collection('events').doc(eventId).get()
    await creditVolunteerHoursForEventAttendance({
      eventId,
      event: eventSnap.data() || {},
      registrationId: doc.id,
      userId,
      source: 'registration',
    })
    processed += 1
  }
  await stateRef.set(
    {
      lastId: snap.size < limit ? '' : lastId,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )
  return processed
}

async function issueCertificates(userId: string): Promise<string[]> {
  try {
    const { evaluateCertificateMilestonesForUser } = await import(
      '@/lib/certificate-milestones-server'
    )
    const result = await evaluateCertificateMilestonesForUser(userId)
    return result.issued
  } catch (err) {
    console.error('[volunteer-hours] certificate milestones:', err)
    return []
  }
}

/**
 * Recompute all event-based volunteer records for a user from each event’s start–end duration.
 * Fixes older flat “1 per event” / default-2 credits.
 */
export async function reconcileVolunteerHoursForUser(userId: string): Promise<{
  updated: number
  totalHours: number
}> {
  if (!userId) return { updated: 0, totalHours: 0 }

  const db = getAdminDb()
  const recordsSnap = await db.collection('volunteerRecords').where('userId', '==', userId).get()

  let updated = 0
  let totalHours = 0
  let profileDelta = 0

  for (const doc of recordsSnap.docs) {
    const data = doc.data()
    const eventId = typeof data.eventId === 'string' ? data.eventId : ''
    const prevHours = Number(data.hours || 0)

    if (!eventId) {
      totalHours += prevHours
      continue
    }

    const eventSnap = await db.collection('events').doc(eventId).get()
    if (!eventSnap.exists) {
      totalHours += prevHours
      continue
    }

    const event = eventSnap.data() || {}
    if (!isCharityVolunteerEvent(event)) {
      totalHours += prevHours
      continue
    }

    const nextHours = computeVolunteerHoursFromEvent(event)
    if (nextHours <= 0) {
      totalHours += prevHours
      continue
    }

    totalHours += nextHours
    const delta = Math.round((nextHours - prevHours) * 4) / 4
    if (delta === 0) continue

    await doc.ref.update({
      hours: nextHours,
      hoursSource: 'event_duration',
      hoursCorrectedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    profileDelta += delta
    updated += 1
  }

  if (profileDelta !== 0) {
    await db.collection('users').doc(userId).set(
      {
        volunteeredHours: FieldValue.increment(profileDelta),
        volunteerHours: FieldValue.increment(profileDelta),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )
  }

  // Keep profile total aligned with the sum of records
  const userSnap = await db.collection('users').doc(userId).get()
  const profileHours = Number(
    userSnap.data()?.volunteeredHours ?? userSnap.data()?.volunteerHours ?? 0
  )
  if (updated > 0 || profileHours !== totalHours) {
    if (profileHours !== totalHours) {
      await db.collection('users').doc(userId).set(
        {
          volunteeredHours: totalHours,
          volunteerHours: totalHours,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )
    }

    try {
      const { evaluateCertificateMilestonesForUser } = await import(
        '@/lib/certificate-milestones-server'
      )
      await evaluateCertificateMilestonesForUser(userId)
    } catch (err) {
      console.error('[volunteer-hours] reconcile milestones:', err)
    }
  }

  return { updated, totalHours }
}

