import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sendEventReminderEmail, type EventReminderKind } from '@/lib/event-confirmation-email'
import { shouldNotifyUser } from '@/lib/user-settings'
import { getEventLocationLabel } from '@/lib/event-utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

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

function dubaiParts(d: Date): { dayKey: string; hour: number } {
  const dayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    hour: 'numeric',
    hour12: false,
  }).format(d)
  return { dayKey, hour: Number(hourStr) }
}

function hoursUntil(start: Date, now: Date): number {
  return (start.getTime() - now.getTime()) / (1000 * 60 * 60)
}

function daysUntilCeil(start: Date, now: Date): number {
  return Math.max(0, Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

/** Daily countdown emails only within this many days of the event (not months out). */
const DAILY_COUNTDOWN_MAX_DAYS = 14

/**
 * - hours_before: ~6h window (hourly cron catches this once)
 * - day_before: ~2 days out (~48h window)
 * - daily: once per Dubai calendar day at 09:00 Asia/Dubai when the event
 *   is within DAILY_COUNTDOWN_MAX_DAYS (stops far-out December spam)
 */
function resolveReminder(
  startDate: Date,
  now: Date
): { kind: EventReminderKind; markerKey: string; daysUntil: number } | null {
  const hrs = hoursUntil(startDate, now)
  if (hrs <= 0) return null

  const days = daysUntilCeil(startDate, now)
  const { dayKey, hour } = dubaiParts(now)

  // ~6 hours before
  if (hrs >= 5.5 && hrs <= 6.75) {
    return {
      kind: 'hours_before',
      markerKey: `hours_before_${startDate.toISOString()}`,
      daysUntil: days,
    }
  }
  // ~2 days before (~48 hours)
  if (hrs >= 46 && hrs <= 50) {
    return {
      kind: 'day_before',
      markerKey: `two_days_before_${startDate.toISOString()}`,
      daysUntil: days,
    }
  }

  // Daily countdown at 9am Dubai — only for events within the near window
  if (hour !== 9) return null
  if (days > DAILY_COUNTDOWN_MAX_DAYS) return null

  return {
    kind: 'daily',
    markerKey: `daily_${dayKey}`,
    daysUntil: days,
  }
}

function isEligibleRegistration(data: Record<string, unknown>): boolean {
  const status = String(data.status || '')
  if (status !== 'confirmed') return false
  const pay = String(data.paymentStatus || '')
  if (pay === 'pending' || pay === 'pending_host') return false
  return true
}

function pushTitle(kind: EventReminderKind, daysUntil: number): string {
  if (kind === 'hours_before') return 'Event in about 6 hours'
  if (kind === 'day_before') return 'Event in 2 days'
  if (daysUntil === 0) return 'Event today'
  if (daysUntil === 1) return 'Event tomorrow'
  return `Event in ${daysUntil} days`
}

/**
 * Hourly job (AWS host crontab via .github/workflows/deploy.yml — not Vercel).
 * Confirmed registrants get a daily countdown at 09:00 Asia/Dubai only when
 * the event is within 14 days, plus ~2-day and ~6-hour reminders.
 * Auth: Authorization Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const now = new Date()
    // Only near-term events: daily countdown ≤14d; day-before / 3h are closer still.
    const windowEnd = new Date(now.getTime() + (DAILY_COUNTDOWN_MAX_DAYS + 1) * 24 * 60 * 60 * 1000)

    const eventsSnap = await db
      .collection('events')
      .where('status', '==', 'published')
      .where('startDate', '>=', Timestamp.fromDate(now))
      .where('startDate', '<=', Timestamp.fromDate(windowEnd))
      .limit(200)
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

      const reminder = resolveReminder(startDate, now)
      if (!reminder) {
        skipped++
        continue
      }

      const { kind, markerKey, daysUntil } = reminder
      const title = String(event.title || 'Your event')
      const eventUrl = `${siteUrl()}/events/${eventDoc.id}`
      const locationLabel = getEventLocationLabel(
        event as Parameters<typeof getEventLocationLabel>[0]
      )

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

        // Skip first daily within 6h of confirmation (avoid stacking on pay email)
        if (kind === 'daily') {
          const registeredAt =
            toDate(reg.paidAt) || toDate(reg.confirmedAt) || toDate(reg.createdAt)
          if (registeredAt && now.getTime() - registeredAt.getTime() < 6 * 60 * 60 * 1000) {
            skipped++
            continue
          }
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
            /* fall through */
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
          daysUntil,
          checkInCode: typeof reg.checkInCode === 'string' ? reg.checkInCode : null,
        })

        if (userId) {
          void import('@/lib/push-notifications-server').then(({ pushToUserSafe }) => {
            pushToUserSafe(
              userId,
              {
                title: pushTitle(kind, daysUntil),
                body: title,
              },
              {
                type: 'event_reminder',
                eventId: eventDoc.id,
                click_action: `/events/${eventDoc.id}`,
              }
            )
          })
        }

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
