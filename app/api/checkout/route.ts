import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { persistUserReferralAttribution } from '@/lib/referral-attribution-server'
import { getReferralCodeFromRequest } from '@/lib/referral-cookie'
import { resolvePayPalConfig } from '@/lib/resolve-paypal-config'
import { resolveZiinaConfig } from '@/lib/resolve-ziina-config'
import {
  createPayPalSubscription,
  ensurePayPalBillingPlan,
} from '@/lib/paypal-client'
import { createZiinaPaymentIntent } from '@/lib/ziina-client'
import { createStripeMembershipIntent, getPublicAppUrl } from '@/lib/payment-completion'
import { planTrialDays, normalizePlanTrialMonths } from '@/lib/pricing-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Gateway = 'stripe' | 'paypal' | 'ziina'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, userId, referralCode: bodyReferralCode, promoCode: bodyPromoCode } = body
    const gateway = (body.gateway || 'stripe') as Gateway

    if (!planId || !userId) {
      return NextResponse.json({ error: 'Missing planId or userId' }, { status: 400 })
    }

    const referralCode =
      (typeof bodyReferralCode === 'string' && bodyReferralCode.trim()) ||
      getReferralCodeFromRequest(req) ||
      ''
    if (referralCode) {
      void persistUserReferralAttribution(userId, referralCode).catch(console.error)
    }

    const promoCode =
      typeof bodyPromoCode === 'string' && bodyPromoCode.trim()
        ? bodyPromoCode.trim()
        : ''

    const db = getAdminDb()
    const planDoc = await db.collection('pricingPlans').doc(planId).get()
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const plan = { id: planId, ...planDoc.data() } as Record<string, unknown>
    const planGateway = (plan.paymentGateway as Gateway) || gateway
    const selected: Gateway =
      gateway === 'stripe' || gateway === 'paypal' || gateway === 'ziina'
        ? gateway
        : planGateway === 'paypal' || planGateway === 'ziina'
          ? planGateway
          : 'stripe'

    if (planTrialDays(plan) && selected !== 'stripe') {
      return NextResponse.json(
        {
          error:
            'This plan includes a free trial. Stripe must collect a card now so billing can start after the trial. Switch the plan to Stripe in Admin → Pricing, or turn the trial off.',
        },
        { status: 400 }
      )
    }

    switch (selected) {
      case 'stripe':
        return handleStripeCheckout(plan, userId, planId, promoCode)
      case 'paypal':
        return handlePayPalCheckout(plan, userId, planId)
      case 'ziina':
        return handleZiinaCheckout(plan, userId, planId)
      default:
        return NextResponse.json({ error: 'Invalid payment gateway' }, { status: 400 })
    }
  } catch (error) {
    console.error('[checkout]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}

async function handleStripeCheckout(
  plan: Record<string, unknown>,
  userId: string,
  planId: string,
  promoCode = ''
) {
  try {
    const trialDays = planTrialDays(plan)
    const trialMonths = normalizePlanTrialMonths(plan.trialMonths)

    let couponId: string | undefined
    const extraMetadata: Record<string, string> = trialMonths
      ? { trialMonths: String(trialMonths) }
      : {}

    const {
      findPromoByCode,
      mapPromoDoc,
      MEMBERSHIP_PROMO_COLLECTION,
      promoGrantsFreeAccess,
      ensurePromoStripeCoupon,
      resolvePromoStatus,
      normalizePromoCode,
    } = await import('@/lib/membership-promo')

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(userId).get()
    const userData = userSnap.data() || {}

    // Prefer an explicit code from the client; otherwise reuse a reserved promo on the user.
    const reservedCode = String(userData.membershipPromoCode || userData.promoCode || '').trim()
    const codeToApply = normalizePromoCode(promoCode || reservedCode)

    if (codeToApply) {
      let promo = await findPromoByCode(codeToApply)
      if (!promo && userData.membershipPromoCodeId) {
        const promoSnap = await db
          .collection(MEMBERSHIP_PROMO_COLLECTION)
          .doc(String(userData.membershipPromoCodeId))
          .get()
        if (promoSnap.exists) {
          promo = mapPromoDoc(promoSnap.id, promoSnap.data() as Record<string, unknown>)
        }
      }
      if (promo) {
        const status = resolvePromoStatus(promo)
        // Reserved codes may already be marked exhausted for this user — still apply discount.
        const reservedForUser =
          userData.membershipPromoCodeId === promo.id ||
          normalizePromoCode(userData.membershipPromoCode) === promo.code
        if (status === 'active' || reservedForUser) {
          if (!promoGrantsFreeAccess(promo) && promo.type === 'percent_off') {
            const id = await ensurePromoStripeCoupon(promo)
            if (id) {
              couponId = id
              extraMetadata.promoCodeId = promo.id
              extraMetadata.promoCode = promo.code
              extraMetadata.percentOff = String(promo.percentOff)
              extraMetadata.discountMonths = String(promo.benefitDurationMonths)
            }
          } else if (promoGrantsFreeAccess(promo) && promo.trialEnabled) {
            // Free trial promo — billing starts after benefit duration; no coupon needed.
            extraMetadata.promoCodeId = promo.id
            extraMetadata.promoCode = promo.code
          }
        }
      }
    }

    const { clientSecret, mode, subscriptionId, alreadyComplete } = await createStripeMembershipIntent({
      planId,
      userId,
      trialDays,
      couponId,
      extraMetadata: Object.keys(extraMetadata).length ? extraMetadata : undefined,
    })
    return NextResponse.json({
      clientSecret,
      mode,
      subscriptionId,
      alreadyComplete: Boolean(alreadyComplete),
      gateway: 'stripe',
      ...(couponId
        ? {
            discountApplied: true,
            percentOff: Number(extraMetadata.percentOff) || undefined,
          }
        : {}),
    })
  } catch (error) {
    console.error('[checkout] Stripe:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Stripe checkout failed. Configure Stripe in Admin → Integrations.',
      },
      { status: 500 }
    )
  }
}

async function handlePayPalCheckout(
  plan: Record<string, unknown>,
  userId: string,
  planId: string
) {
  try {
    const config = await resolvePayPalConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'PayPal is not configured. Add credentials in Admin → Integrations.' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const site = getPublicAppUrl()
    const { productId, paypalPlanId } = await ensurePayPalBillingPlan({
      planId,
      name: String(plan.name || 'Membership'),
      description: String(plan.description || ''),
      priceCents: Number(plan.price) || 0,
      currency: String(plan.currency || 'AED'),
      billingPeriod: String(plan.billingPeriod || 'monthly'),
      existingProductId: plan.paypalProductId as string | undefined,
      existingPlanId: plan.paypalPlanId as string | undefined,
    })

    if (!plan.paypalPlanId || !plan.paypalProductId) {
      await db.collection('pricingPlans').doc(planId).update({
        paypalPlanId,
        paypalProductId: productId,
      })
    }

    const userSnap = await db.collection('users').doc(userId).get()
    const email = (userSnap.data()?.email as string) || undefined

    const subscription = await createPayPalSubscription({
      paypalPlanId,
      email,
      returnUrl: `${site}/api/paypal/return?type=membership&planId=${encodeURIComponent(planId)}&userId=${encodeURIComponent(userId)}`,
      cancelUrl: `${site}/dashboard/membership?status=canceled`,
      customId: `${userId}:${planId}`,
    })

    await db.collection('checkoutSessions').add({
      userId,
      planId,
      subscriptionId: subscription.id,
      gateway: 'paypal',
      status: 'pending',
      createdAt: Timestamp.now(),
    })

    return NextResponse.json({
      checkoutUrl: subscription.approveUrl,
      gateway: 'paypal',
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error('[checkout] PayPal:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PayPal checkout failed' },
      { status: 500 }
    )
  }
}

async function handleZiinaCheckout(
  plan: Record<string, unknown>,
  userId: string,
  planId: string
) {
  try {
    const config = await resolveZiinaConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'Ziina is not configured. Add credentials in Admin → Integrations.' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const site = getPublicAppUrl()
    const amountMinor = Number(plan.price) || 0
    const currency = String(plan.currency || 'AED')
    const successUrl =
      `${site}/api/ziina/return?type=membership` +
      `&planId=${encodeURIComponent(planId)}` +
      `&userId=${encodeURIComponent(userId)}` +
      `&payment_intent_id={PAYMENT_INTENT_ID}`
    const cancelUrl = `${site}/dashboard/membership?status=canceled`

    const intent = await createZiinaPaymentIntent({
      amountMinor,
      currency,
      message: `${String(plan.name || 'Membership')} — ${String(plan.billingPeriod || 'monthly')} membership`,
      successUrl,
      cancelUrl,
    })

    if (!intent.redirect_url) {
      throw new Error('Ziina did not return a redirect URL')
    }

    await db.collection('checkoutSessions').add({
      userId,
      planId,
      transactionId: intent.id,
      gateway: 'ziina',
      status: 'pending',
      createdAt: Timestamp.now(),
    })

    return NextResponse.json({
      checkoutUrl: intent.redirect_url,
      gateway: 'ziina',
      paymentIntentId: intent.id,
    })
  } catch (error) {
    console.error('[checkout] Ziina:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ziina checkout failed' },
      { status: 500 }
    )
  }
}
