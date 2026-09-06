import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sendEventReminderEmail, type EventReminderKind } from '@/lib/event-confirmation-email'
import { shouldNotifyUser } from '@/lib/user-settings'
import { getEventLocationLabel } from '@/lib/event-utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }
  return null
}

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || ''
  const authHeader = request.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const headerSecret = request.headers.get('x-vercel-cron-secret') || ''
  if (!cronSecret) {
    return Boolean(request.headers.get('x-vercel-cron') === '1' || bearer || headerSecret)
  }
  return bearer === cronSecret || headerSecret === cronSecret
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

function resolveReminderKind(hoursUntil: number): EventReminderKind | null {
  // ~1 day before (hourly cron catches this window)
  if (hoursUntil >= 20 && hoursUntil <= 28) return 'day_before'
  // ~3 hours before
  if (hoursUntil >= 2.5 && hoursUntil <= 3.75) return 'hours_before'
  return null
}

function isEligibleRegistration(data: Record<string, unknown>): boolean {
  const status = String(data.status || '')
  if (status !== 'confirmed') return false
  const pay = String(data.paymentStatus || '')
  if (pay === 'pending') return false
  return true
}

/**
 * Hourly: email confirmed registrants for events starting ~1 day or ~3 hours out.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const now = new Date()
    const windowEnd = new Date(now.getTime() + 30 * 60 * 60 * 1000) // 30h ahead

    const eventsSnap = await db
      .collection('events')
      .where('status', '==', 'published')
      .where('startDate', '>=', Timestamp.fromDate(now))
      .where('startDate', '<=', Timestamp.fromDate(windowEnd))
      .limit(100)
      .get()

    let scannedEvents = 0
    let scannedRegs = 0
    let sent = 0
    let skipped = 0

    for (const eventDoc of eventsSnap.docs) {
      scannedEvents++
      const event = eventDoc.data() || {}
      const startDate = toDate(event.startDate)
      if (!startDate) {
        skipped++
        continue
      }

      const hoursUntil = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      const kind = resolveReminderKind(hoursUntil)
      if (!kind) {
        skipped++
        continue
      }

      const markerKey = `${kind}_${startDate.toISOString()}`
      const title = String(event.title || 'Your event')
      const eventUrl = `${siteUrl()}/events/${eventDoc.id}`
      const locationLabel = getEventLocationLabel(event as Parameters<typeof getEventLocationLabel>[0])

      const regsSnap = await db
        .collection('eventRegistrations')
        .where('eventId', '==', eventDoc.id)
        .where('status', '==', 'confirmed')
        .limit(500)
        .get()

      for (const regDoc of regsSnap.docs) {
        scannedRegs++
        const reg = regDoc.data() || {}
        if (!isEligibleRegistration(reg)) {
          skipped++
          continue
        }

        const already = Array.isArray(reg.eventReminderKeys)
          ? (reg.eventReminderKeys as string[])
          : []
        if (already.includes(markerKey)) {
          skipped++
          continue
        }

        const userId = String(reg.userId || '').trim()
        let to = String(reg.userEmail || '').trim()

        if (userId) {
          try {
            const userSnap = await db.collection('users').doc(userId).get()
            const userData = userSnap.exists ? userSnap.data() : null
            if (
              userData &&
              !shouldNotifyUser(
                { id: userId, ...(userData as object) } as Parameters<typeof shouldNotifyUser>[0],
                'email',
                'eventReminders'
              )
            ) {
              skipped++
              continue
            }
            const profileEmail = String(userData?.email || '').trim()
            if (profileEmail.includes('@')) to = profileEmail
          } catch {
            /* fall through with registration email */
          }
        }

        if (!to.includes('@')) {
          skipped++
          continue
        }

        const ok = await sendEventReminderEmail({
          to,
          eventTitle: title,
          eventUrl,
          startDate,
          locationLabel,
          kind,
          checkInCode: typeof reg.checkInCode === 'string' ? reg.checkInCode : null,
        })

        if (ok) {
          await regDoc.ref.set(
            {
              eventReminderKeys: [...already, markerKey],
              lastEventReminderAt: now.toISOString(),
              lastEventReminderKind: kind,
            },
            { merge: true }
          )
          sent++
        } else {
          skipped++
        }
      }
    }

    return NextResponse.json({
      success: true,
      scannedEvents,
      scannedRegs,
      sent,
      skipped,
    })
  } catch (error) {
    console.error('[cron/event-reminders]', error)
    return NextResponse.json({ error: 'Failed to process event reminders' }, { status: 500 })
  }
}
