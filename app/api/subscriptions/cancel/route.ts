import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-utils'
import { getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Stop subscription renewal (cancel at period end) or cancel immediately.
 * Body: { subscriptionId, stripeSubscriptionId?, stopRenewalOnly? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subscriptionId = String(body.subscriptionId || '').trim()
    const stripeSubscriptionId = String(body.stripeSubscriptionId || '').trim()
    const stopRenewalOnly = body.stopRenewalOnly !== false

    if (!subscriptionId && !stripeSubscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    const db = getAdminDb()
    let docRef = subscriptionId ? db.collection('subscriptions').doc(subscriptionId) : null
    let snap = docRef ? await docRef.get() : null

    if (!snap?.exists && stripeSubscriptionId) {
      const q = await db
        .collection('subscriptions')
        .where('stripeSubscriptionId', '==', stripeSubscriptionId)
        .limit(1)
        .get()
      if (!q.empty) {
        docRef = q.docs[0].ref
        snap = q.docs[0]
      }
    }

    const data = snap?.exists ? snap.data() : null
    const stripeId =
      stripeSubscriptionId ||
      String(data?.stripeSubscriptionId || '') ||
      (subscriptionId.startsWith('sub_') ? subscriptionId : '')

    if (stripe && stripeId) {
      if (stopRenewalOnly) {
        await stripe.subscriptions.update(stripeId, { cancel_at_period_end: true })
      } else {
        await stripe.subscriptions.cancel(stripeId)
      }
    }

    if (docRef && snap?.exists) {
      await docRef.update(
        stopRenewalOnly
          ? {
              cancelAtPeriodEnd: true,
              status: data?.status === 'cancelled' ? 'active' : data?.status || 'active',
              updatedAt: FieldValue.serverTimestamp(),
            }
          : {
              status: 'cancelled',
              cancelAtPeriodEnd: false,
              cancelledAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            }
      )
    }

    return NextResponse.json({ success: true, stopRenewalOnly })
  } catch (error: unknown) {
    console.error('[v0] Error cancelling subscription:', error)
    const message = error instanceof Error ? error.message : 'Cancel failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
