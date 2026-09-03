import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { notifyMembershipExpired } from '@/lib/member-notifications'
import { getStripeClient } from '@/lib/get-stripe-client'
import { subscriptionPeriodEndUnix } from '@/lib/stripe-membership-billing'

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
    // Allow scheduler requests without a shared secret only when CRON_SECRET is unset.
    return Boolean(request.headers.get('x-vercel-cron') === '1' || bearer || headerSecret)
  }
  return bearer === cronSecret || headerSecret === cronSecret
}

/**
 * Daily: downgrade any 'active' membership whose renewDate has passed and
 * that Stripe is no longer auto-debiting.
 *
 * Stripe memberships are charge_automatically subscriptions. Each successful
 * cycle (invoice.paid) pushes membershipRenewDate forward. This job is the
 * safety net for promo grants, PayPal/Ziina one-shots, and cancelled cards —
 * not a substitute for Stripe's monthly charge.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const now = new Date()

    const snap = await db.collection('users').where('membershipStatus', '==', 'active').limit(500).get()

    let expired = 0
    let skipped = 0

    for (const doc of snap.docs) {
      const data = doc.data() || {}
      if (data.membershipLifetimeForever === true) {
        skipped++
        continue
      }

      const renewDate = toDate(data.membershipRenewDate)
      if (!renewDate || renewDate >= now) {
        skipped++
        continue
      }

      let stripeSubId =
        typeof data.stripeSubscriptionId === 'string' ? data.stripeSubscriptionId.trim() : ''
      if (!stripeSubId.startsWith('sub_')) {
        const subSnap = await db
          .collection('subscriptions')
          .where('userId', '==', doc.id)
          .limit(8)
          .get()
        const live = subSnap.docs.find((d) => {
          const s = d.data() || {}
          const id = String(s.stripeSubscriptionId || d.id)
          return id.startsWith('sub_') && ['active', 'trialing', 'past_due'].includes(String(s.status || ''))
        })
        if (live) {
          stripeSubId = String(live.data()?.stripeSubscriptionId || live.id)
        }
      }
      if (stripeSubId.startsWith('sub_') && data.membershipAutoRenew !== false) {
        try {
          const stripe = await getStripeClient()
          const sub = await stripe.subscriptions.retrieve(stripeSubId)
          if (['active', 'trialing', 'past_due'].includes(sub.status)) {
            const periodEndUnix = subscriptionPeriodEndUnix(sub)
            const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null
            if (periodEnd && periodEnd >= now) {
              await doc.ref.set(
                {
                  membershipStatus: 'active',
                  membershipRenewDate: periodEnd.toISOString(),
                  membershipExpiredAt: FieldValue.delete(),
                  updatedAt: Timestamp.now(),
                },
                { merge: true }
              )
              skipped++
              continue
            }
            if (sub.status === 'past_due') {
              skipped++
              continue
            }
          }
        } catch (err) {
          console.error('[cron/membership-expire] Stripe lookup failed, keeping access:', stripeSubId, err)
          skipped++
          continue
        }
      }

      await doc.ref.set(
        {
          membershipStatus: 'expired',
          membershipExpiredAt: now.toISOString(),
        },
        { merge: true }
      )

      notifyMembershipExpired({
        userId: doc.id,
        planName: String(data.membershipPlanName || data.membershipTier || 'membership'),
      })

      expired++
    }

    return NextResponse.json({
      success: true,
      scanned: snap.size,
      expired,
      skipped,
    })
  } catch (error) {
    console.error('[cron/membership-expire]', error)
    return NextResponse.json({ error: 'Failed to process expirations' }, { status: 500 })
  }
}
