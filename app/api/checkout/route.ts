import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { persistUserReferralAttribution } from '@/lib/referral-attribution-server'
import { getReferralCodeFromRequest } from '@/lib/referral-cookie'
import { getStripeClient } from '@/lib/get-stripe-client'
import { resolvePayPalConfig } from '@/lib/resolve-paypal-config'
import { resolveZiinaConfig } from '@/lib/resolve-ziina-config'
import {
  createPayPalSubscription,
  ensurePayPalBillingPlan,
} from '@/lib/paypal-client'
import { createZiinaPaymentIntent } from '@/lib/ziina-client'
import { getPublicAppUrl } from '@/lib/payment-completion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Gateway = 'stripe' | 'paypal' | 'ziina'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, userId, referralCode: bodyReferralCode } = body
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

    switch (selected) {
      case 'stripe':
        return handleStripeCheckout(plan, userId, planId)
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
  planId: string
) {
  try {
    const stripe = await getStripeClient()
    const db = getAdminDb()
    const site = getPublicAppUrl()

    // Cached stripeProductId/stripePriceId on the plan doc are only valid
    // for whichever Stripe account + mode (test/live) created them — if the
    // Stripe credentials in Admin → Integrations were ever changed (a new
    // account, or switching from test to live keys), every previously
    // cached id becomes a dangling reference that Stripe rejects with "No
    // such price"/"No such product". Retrieving before trusting the cache
    // (and clearing + recreating on a miss) makes checkout self-healing
    // instead of permanently broken until someone edits the plan by hand.
    let productId = plan.stripeProductId as string | undefined
    if (productId) {
      const exists = await stripe.products.retrieve(productId).then(
        () => true,
        () => false
      )
      if (!exists) productId = undefined
    }
    if (!productId) {
      const product = await stripe.products.create({
        name: String(plan.name || 'Membership'),
        description: String(plan.description || ''),
        metadata: { planId },
      })
      productId = product.id
      await db.collection('pricingPlans').doc(planId).update({ stripeProductId: productId })
    }

    // A stale product forces a stale price too — a price object is
    // permanently tied to the product it was created under.
    let priceId = productId === plan.stripeProductId ? (plan.stripePriceId as string | undefined) : undefined
    if (priceId) {
      const exists = await stripe.prices.retrieve(priceId).then(
        () => true,
        () => false
      )
      if (!exists) priceId = undefined
    }
    if (!priceId) {
      const price = await stripe.prices.create({
        unit_amount: Number(plan.price) || 0,
        currency: String(plan.currency || 'aed').toLowerCase(),
        recurring: {
          interval: plan.billingPeriod === 'yearly' ? 'year' : 'month',
        },
        product: productId,
      })
      priceId = price.id
      await db.collection('pricingPlans').doc(planId).update({ stripePriceId: priceId })
    }

    const userSnap = await db.collection('users').doc(userId).get()
    const email = (userSnap.data()?.email as string) || undefined

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${site}/dashboard/membership?status=success`,
      cancel_url: `${site}/dashboard/membership?status=canceled`,
      customer_email: email,
      metadata: {
        type: 'membership',
        userId,
        planId,
      },
    })

    await db.collection('checkoutSessions').add({
      userId,
      planId,
      sessionId: session.id,
      gateway: 'stripe',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
      gateway: 'stripe',
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
