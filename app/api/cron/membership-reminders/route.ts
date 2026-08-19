import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { notifyMembershipExpiring } from '@/lib/member-notifications'

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

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function daysUntil(renew: Date, now: Date): number {
  const a = startOfUtcDay(renew).getTime()
  const b = startOfUtcDay(now).getTime()
  return Math.round((a - b) / (1000 * 60 * 60 * 24))
}

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || ''
  const authHeader = request.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const headerSecret = request.headers.get('x-vercel-cron-secret') || ''
  if (!cronSecret) {
    // Allow scheduler requests without a shared secret only when CRON_SECRET is unset.
    return Boolean(request.headers.get('x-vercel-cron') === '1' || bearer || headerSecret)
  }
  return bearer === cronSecret || headerSecret === cronSecret
}

/**
 * Daily: branded reminders for memberships expiring in 7, 3, or 1 day(s).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const now = new Date()
    const windowEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)

    const snap = await db
      .collection('users')
      .where('membershipStatus', '==', 'active')
      .limit(500)
      .get()

    let sent = 0
    let skipped = 0
    const reminderDays = new Set([1, 3, 7])

    for (const doc of snap.docs) {
      const data = doc.data() || {}
      if (data.membershipLifetimeForever === true) {
        skipped++
        continue
      }

      const renewDate = toDate(data.membershipRenewDate)
      if (!renewDate || renewDate.getFullYear() >= 9999) {
        skipped++
        continue
      }
      if (renewDate < now || renewDate > windowEnd) {
        skipped++
        continue
      }

      const daysLeft = daysUntil(renewDate, now)
      if (!reminderDays.has(daysLeft)) {
        skipped++
        continue
      }

      const marker = `expiring_${daysLeft}d_${renewDate.toISOString().slice(0, 10)}`
      const already = String(data.lastExpiryReminderKey || '')
      if (already === marker) {
        skipped++
        continue
      }

      notifyMembershipExpiring({
        userId: doc.id,
        planName: String(data.membershipPlanName || data.membershipTier || 'membership'),
        renewDate,
        daysLeft,
      })

      await doc.ref.set(
        {
          lastExpiryReminderKey: marker,
          lastExpiryReminderAt: now.toISOString(),
        },
        { merge: true }
      )
      sent++
    }

    return NextResponse.json({
      success: true,
      scanned: snap.size,
      sent,
      skipped,
    })
  } catch (error) {
    console.error('[cron/membership-reminders]', error)
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 })
  }
}
