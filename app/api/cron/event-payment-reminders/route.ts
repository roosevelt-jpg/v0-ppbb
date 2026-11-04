import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sendEventPaymentRequestEmail } from '@/lib/event-confirmation-email'
import { flagRegistrationForPayment, unpaidRegistrationAmount } from '@/lib/event-luma-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/** At most one nudge in the final day (hourly cron may miss a tick). */
const REMINDER_INTERVAL_MS = 20 * 60 * 60 * 1000
/** Only remind when the event starts within the next day. */
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000

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
  if (!cronSecret) return Boolean(bearer)
  return bearer === cronSecret
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

/**
 * Hourly job (AWS host crontab via .github/workflows/deploy.yml).
 * One day before a paid event, guests who still owe for their ticket are
 * flagged and reminded once (not every hour for weeks ahead).
 * Auth: Authorization Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const now = new Date()
    const windowEnd = new Date(now.getTime() + LOOKAHEAD_MS)

    const eventsSnap = await db
      .collection('events')
      .where('status', '==', 'published')
      .where('startDate', '>=', Timestamp.fromDate(now))
      .where('startDate', '<=', Timestamp.fromDate(windowEnd))
      .limit(200)
      .get()

    let flagged = 0
    let reminded = 0
    let emailed = 0

    for (const eventDoc of eventsSnap.docs) {
      const event = (eventDoc.data() || {}) as Record<string, unknown>
      const regs = db.collection('eventRegistrations').where('eventId', '==', eventDoc.id)
      const [confirmedSnap, awaitingSnap] = await Promise.all([
        regs.where('status', '==', 'confirmed').limit(500).get(),
        regs.where('status', '==', 'pending_payment').limit(500).get(),
      ])

      const due: Array<{ ref: FirebaseFirestore.DocumentReference; reg: Record<string, unknown>; amount: number }> = []

      for (const doc of confirmedSnap.docs) {
        const reg = doc.data() || {}
        const amount = unpaidRegistrationAmount(reg, event)
        if (!(amount > 0)) continue
        const last = toDate(reg.lastPaymentReminderAt)
        if (last && now.getTime() - last.getTime() < REMINDER_INTERVAL_MS) continue
        const updated = await flagRegistrationForPayment(doc.ref, reg, event, amount)
        flagged++
        due.push({ ref: doc.ref, reg: updated, amount })
      }

      for (const doc of awaitingSnap.docs) {
        const reg = doc.data() || {}
        // Only guests who already hold a seat; abandoned checkouts are left alone.
        if (reg.attendeeCounted !== true || reg.paymentStatus !== 'pending') continue
        const amount = Number(reg.ticketPrice) || 0
        if (!(amount > 0)) continue
        const last = toDate(reg.lastPaymentReminderAt)
        if (last && now.getTime() - last.getTime() < REMINDER_INTERVAL_MS) continue
        due.push({ ref: doc.ref, reg, amount })
      }

      for (const { ref, reg, amount } of due) {
        const ok = await sendEventPaymentRequestEmail({
          to: String(reg.userEmail || ''),
          eventTitle: String(event.title || 'Event'),
          eventUrl: `${siteUrl()}/events/${eventDoc.id}?pay=1`,
          amount,
          currency: String(reg.currency || event.currency || 'AED'),
          userId: typeof reg.userId === 'string' ? reg.userId : null,
          isReminder: Number(reg.paymentReminderCount) > 0,
        })
        await ref.set(
          {
            lastPaymentReminderAt: Timestamp.fromDate(now),
            paymentReminderCount: (Number(reg.paymentReminderCount) || 0) + 1,
          },
          { merge: true }
        )
        reminded++
        if (ok) emailed++
      }
    }

    return NextResponse.json({
      success: true,
      scannedEvents: eventsSnap.size,
      flagged,
      reminded,
      emailed,
    })
  } catch (error) {
    console.error('[cron/event-payment-reminders]', error)
    return NextResponse.json({ error: 'Failed to process payment reminders' }, { status: 500 })
  }
}
