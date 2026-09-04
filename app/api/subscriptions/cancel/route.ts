import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-utils'
import { getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyIdToken } from '@/lib/admin-access-server'
import { notifyMembershipCancelled } from '@/lib/member-notifications'

/**
 * Stop subscription renewal (cancel at period end) or cancel immediately.
 * Body: { subscriptionId?, stripeSubscriptionId?, stopRenewalOnly? }
 * Auth required — only the owning member may cancel.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const subscriptionId = String(body.subscriptionId || '').trim()
    const stripeSubscriptionId = String(body.stripeSubscriptionId || '').trim()
    const stopRenewalOnly = body.stopRenewalOnly !== false

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

    if (!snap?.exists) {
      const byUser = await db
        .collection('subscriptions')
        .where('userId', '==', uid)
        .limit(10)
        .get()
      const live = byUser.docs.find((d) => {
        const st = String(d.data().status || '')
        return st === 'active' || st === 'trialing' || d.data().cancelAtPeriodEnd === true
      })
      if (live) {
        docRef = live.ref
        snap = live
      }
    }

    const data = snap?.exists ? snap.data() : null
    if (data && String(data.userId || '') && String(data.userId) !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userSnap = await db.collection('users').doc(uid).get()
    const userStripeSub = String(userSnap.data()?.stripeSubscriptionId || '').trim()

    const stripeId =
      stripeSubscriptionId ||
      String(data?.stripeSubscriptionId || '') ||
      userStripeSub ||
      (subscriptionId.startsWith('sub_') ? subscriptionId : '')

    if (!stripeId && !docRef) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

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
    } else if (stripeId) {
      await db.collection('subscriptions').doc(stripeId).set(
        {
          userId: uid,
          stripeSubscriptionId: stripeId,
          gateway: 'stripe',
          cancelAtPeriodEnd: stopRenewalOnly,
          status: stopRenewalOnly ? 'active' : 'cancelled',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    if (stopRenewalOnly) {
      notifyMembershipCancelled({
        userId: uid,
        planName: String(data?.planName || userSnap.data()?.membershipPlanName || ''),
        endsAt: null,
      })
    }

    return NextResponse.json({ success: true, stopRenewalOnly })
  } catch (error: unknown) {
    console.error('[v0] Error cancelling subscription:', error)
    const message = error instanceof Error ? error.message : 'Cancel failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
