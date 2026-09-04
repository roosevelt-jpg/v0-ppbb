import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { ensureRecurringMembershipPrice, membershipRecurringInterval } from '@/lib/stripe-membership-billing'

export const runtime = 'nodejs'

/**
 * Admin membership plan change.
 * mode:
 *  - grant: Firestore access only (no Stripe charge / renew reset optional)
 *  - schedule: change Stripe price at period end (proration_behavior none)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const adminUid = token ? await verifyIdToken(token) : null
    if (!adminUid || !(await isAdminUser(adminUid))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const memberId = String(body.memberId || '').trim()
    const planId = String(body.planId || '').trim()
    const mode = body.mode === 'grant' ? 'grant' : 'schedule'
    if (!memberId || !planId) {
      return NextResponse.json({ success: false, error: 'memberId and planId required' }, { status: 400 })
    }

    const db = getAdminDb()
    const planSnap = await db.collection('pricingPlans').doc(planId).get()
    if (!planSnap.exists) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }
    const plan = planSnap.data() || {}
    const planName = String(plan.name || planId)
    const isBusiness = /business|partner|corporate|company/i.test(planName)

    const userRef = db.collection('users').doc(memberId)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }
    const user = userSnap.data() || {}
    const stripeSubId = String(user.stripeSubscriptionId || '').trim()

    const rolePatch = isBusiness
      ? {
          role: 'business',
          userType: 'business',
          hasBusinessProfile: true,
          roles: ['member', 'business'],
        }
      : {
          role: 'member',
          userType: 'member',
          roles: ['member'],
        }

    if (mode === 'grant') {
      const months = plan.billingPeriod === 'yearly' ? 12 : 1
      const renew = new Date()
      renew.setMonth(renew.getMonth() + months)
      await userRef.set(
        {
          membershipTier: planId,
          membershipPlanId: planId,
          membershipPlanName: planName,
          membershipStatus: 'active',
          membershipRenewDate: renew.toISOString(),
          upgradedAt: FieldValue.serverTimestamp(),
          adminPlanChangeMode: 'grant',
          ...rolePatch,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      return NextResponse.json({
        success: true,
        mode: 'grant',
        message: 'Access granted without changing Stripe billing.',
      })
    }

    // schedule at period end
    let scheduled = false
    let periodEnd: string | null = null
    if (stripeSubId) {
      try {
        const { getStripeClient } = await import('@/lib/get-stripe-client')
        const stripe = await getStripeClient()
        const { priceId } = await ensureRecurringMembershipPrice(
          stripe,
          plan as Record<string, unknown>,
          planId,
          async (patch) => {
            await db.collection('pricingPlans').doc(planId).update(patch)
          }
        )
        const current = await stripe.subscriptions.retrieve(stripeSubId)
        const itemId = current.items.data[0]?.id
        if (itemId) {
          const updated = await stripe.subscriptions.update(stripeSubId, {
            items: [{ id: itemId, price: priceId }],
            proration_behavior: 'none',
            metadata: {
              ...(current.metadata || {}),
              type: 'membership',
              userId: memberId,
              planId,
              billingInterval: membershipRecurringInterval(plan.billingPeriod),
              adminScheduled: 'true',
            },
          })
          scheduled = true
          const endUnix = updated.current_period_end
          if (endUnix) periodEnd = new Date(endUnix * 1000).toISOString()
          await db.collection('subscriptions').doc(stripeSubId).set(
            {
              userId: memberId,
              planId,
              planName,
              stripeSubscriptionId: stripeSubId,
              status: updated.status,
              cancelAtPeriodEnd: Boolean(updated.cancel_at_period_end),
              nextBillingDate: periodEnd,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          )
        }
      } catch (err) {
        console.error('[admin/membership/change-plan] stripe:', err)
        return NextResponse.json(
          {
            success: false,
            error:
              err instanceof Error
                ? err.message
                : 'Could not schedule Stripe plan change. Use Grant access if you only need portal access.',
          },
          { status: 500 }
        )
      }
    }

    await userRef.set(
      {
        membershipTier: planId,
        membershipPlanId: planId,
        membershipPlanName: planName,
        membershipStatus: 'active',
        // Keep existing renew date when scheduling; only set if missing.
        ...(user.membershipRenewDate
          ? {}
          : periodEnd
            ? { membershipRenewDate: periodEnd }
            : {}),
        pendingPlanId: planId,
        pendingPlanName: planName,
        adminPlanChangeMode: 'schedule',
        upgradedAt: FieldValue.serverTimestamp(),
        ...rolePatch,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({
      success: true,
      mode: 'schedule',
      scheduled,
      periodEnd,
      message: scheduled
        ? 'Plan label updated. Stripe will bill the new price from the next renewal.'
        : 'Plan label updated. No Stripe subscription found — billing was not changed.',
    })
  } catch (error) {
    console.error('[admin/membership/change-plan]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
