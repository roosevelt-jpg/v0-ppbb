import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { isCharityVolunteerEvent } from '@/lib/charity-event'

function eventHours(event: Record<string, unknown>): number {
  const start = (event.startDate as { toDate?: () => Date } | null)?.toDate?.()
    ? (event.startDate as { toDate: () => Date }).toDate()
    : event.startDate
      ? new Date(event.startDate as string | number | Date)
      : null
  const end = (event.endDate as { toDate?: () => Date } | null)?.toDate?.()
    ? (event.endDate as { toDate: () => Date }).toDate()
    : event.endDate
      ? new Date(event.endDate as string | number | Date)
      : null
  let hours = 2
  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    if (diff > 0 && diff <= 24) hours = Math.round(diff * 4) / 4
  }
  return hours
}

/**
 * Credit volunteer hours toward certificates when a guest is checked in
 * (or self-confirms attendance) at a charity / volunteer event.
 * Idempotent per registrationId.
 */
export async function creditVolunteerHoursForEventAttendance(opts: {
  eventId: string
  event: Record<string, unknown>
  registrationId: string
  userId: string
}): Promise<{ credited: boolean; hours: number; reason?: string }> {
  const { eventId, event, registrationId, userId } = opts
  if (!userId) return { credited: false, hours: 0, reason: 'no_user' }
  if (!isCharityVolunteerEvent(event)) {
    return { credited: false, hours: 0, reason: 'not_charity_event' }
  }

  const db = getAdminDb()
  const existing = await db
    .collection('volunteerRecords')
    .where('userId', '==', userId)
    .where('registrationId', '==', registrationId)
    .limit(1)
    .get()

  if (!existing.empty) {
    return { credited: false, hours: 0, reason: 'already_credited' }
  }

  const hours = eventHours(event)
  await db.collection('volunteerRecords').add({
    userId,
    eventId,
    eventTitle: String(event.title || 'Charity event'),
    registrationId,
    hours,
    date: Timestamp.now(),
    description: `Attendance confirmed at ${String(event.title || 'event')}`,
    verified: true,
    source: 'event_check_in',
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

  try {
    const { evaluateCertificateMilestonesForUser } = await import(
      '@/lib/certificate-milestones-server'
    )
    await evaluateCertificateMilestonesForUser(userId)
  } catch (err) {
    console.error('[volunteer-hours] certificate milestones:', err)
  }

  return { credited: true, hours }
}
