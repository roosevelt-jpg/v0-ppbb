import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getStripeClient } from '@/lib/get-stripe-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Turn automatic renewal back on for the signed-in member.
 * Does not charge again while the current access period is still open.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as { subscriptionId?: string }))
    const donationSubscriptionId = String(body.subscriptionId || '').trim()
    if (donationSubscriptionId) {
      const { resumeSubscription } = await import('@/lib/stripe-utils')
      await resumeSubscription(donationSubscriptionId)
      const db = getAdminDb()
      await db.collection('subscriptions').doc(donationSubscriptionId).set(
        {
          status: 'active',
          resumedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      return NextResponse.json({ success: true })
    }

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const user = userSnap.data() || {}
    const stripeId = String(user.stripeSubscriptionId || '').trim()
    const membershipStatus = String(user.membershipStatus || '').toLowerCase()

    if (!stripeId && (membershipStatus === 'cancelled' || membershipStatus === 'canceled' || membershipStatus === 'expired')) {
      return NextResponse.json({
        success: false,
        needsCheckout: true,
        error: 'That membership has ended. Choose the plan again to join.',
      })
    }

    if (stripeId) {
      const stripe = await getStripeClient()
      const current = await stripe.subscriptions.retrieve(stripeId)
      if (current.status === 'canceled' || current.status === 'incomplete_expired') {
        return NextResponse.json({
          success: false,
          needsCheckout: true,
          error: 'That membership has ended. Choose the plan again to join.',
        })
      }
      if (current.cancel_at_period_end) {
        const updated = await stripe.subscriptions.update(stripeId, {
          cancel_at_period_end: false,
          proration_behavior: 'none',
        })
        if (updated.cancel_at_period_end) {
          return NextResponse.json(
            { error: 'Stripe did not turn renewal back on. Try again.' },
            { status: 502 }
          )
        }
      }
      await db.collection('subscriptions').doc(stripeId).set(
        {
          userId: uid,
          stripeSubscriptionId: stripeId,
          cancelAtPeriodEnd: false,
          status: current.status || 'active',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    await db.collection('users').doc(uid).set(
      {
        membershipAutoRenew: true,
        membershipStatus: membershipStatus === 'trialing' ? 'trialing' : 'active',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    const subs = await db.collection('subscriptions').where('userId', '==', uid).limit(10).get()
    const batch = db.batch()
    let writes = 0
    subs.docs.forEach((docSnap) => {
      const status = String(docSnap.data().status || '')
      if (status === 'cancelled' || status === 'canceled') return
      batch.set(
        docSnap.ref,
        { cancelAtPeriodEnd: false, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      )
      writes += 1
    })
    if (writes > 0) await batch.commit()

    return NextResponse.json({ success: true, resumedWithoutCharge: true })
  } catch (error) {
    console.error('[subscriptions/resume]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not turn renewal back on' },
      { status: 500 }
    )
  }
}
