import type Stripe from 'stripe'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { getStripeClient } from '@/lib/get-stripe-client'
import { resolveStripeConfig } from '@/lib/resolve-stripe-key'

export type EmbeddedStripePayload = {
  embedded: true
  gateway: 'stripe'
  clientSecret: string
  publishableKey: string
  paymentIntentId: string
  subscriptionId?: string
  orderId?: string
}

async function ensureStripeProductAndPrice(
  stripe: Stripe,
  plan: Record<string, unknown>,
  planId: string
): Promise<{ productId: string; priceId: string }> {
  const { ensureRecurringMembershipPrice } = await import('@/lib/stripe-membership-billing')
  const db = getAdminDb()
  return ensureRecurringMembershipPrice(stripe, plan, planId, async (patch) => {
    await db.collection('pricingPlans').doc(planId).update(patch)
  })
}

async function ensureStripeCustomer(
  stripe: Stripe,
  userId: string,
  email?: string
): Promise<string> {
  const db = getAdminDb()
  const userSnap = await db.collection('users').doc(userId).get()
  const userData = userSnap.data() || {}
  let customerId = String(userData.stripeCustomerId || '').trim()

  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId)
      return customerId
    } catch {
      customerId = ''
    }
  }

  const customer = await stripe.customers.create({
    email: email || (userData.email as string | undefined),
    metadata: { userId },
  })
  await db.collection('users').doc(userId).set(
    { stripeCustomerId: customer.id, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
  return customer.id
}

/** Membership subscription — card fields on-site (no Stripe Checkout redirect). */
export async function createEmbeddedMembershipCheckout(opts: {
  plan: Record<string, unknown>
  planId: string
  userId: string
}): Promise<EmbeddedStripePayload> {
  const stripe = await getStripeClient()
  const config = await resolveStripeConfig()
  if (!config?.publishableKey) {
    throw new Error('Stripe publishable key is not configured.')
  }

  const db = getAdminDb()
  const { priceId } = await ensureStripeProductAndPrice(stripe, opts.plan, opts.planId)
  const userSnap = await db.collection('users').doc(opts.userId).get()
  const email = (userSnap.data()?.email as string) || undefined
  const customerId = await ensureStripeCustomer(stripe, opts.userId, email)

  const { clientSecretForIncompleteSubscription, membershipRecurringInterval } = await import(
    '@/lib/stripe-membership-billing'
  )
  const { planTrialDays } = await import('@/lib/pricing-utils')
  const interval = membershipRecurringInterval(opts.plan.billingPeriod)
  const trialDays = planTrialDays(opts.plan)
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    collection_method: 'charge_automatically',
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
      payment_method_types: ['card'],
    },
    trial_period_days: trialDays,
    expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
    metadata: {
      type: 'membership',
      userId: opts.userId,
      planId: opts.planId,
      autoDebit: 'true',
      billingInterval: interval,
    },
  })

  const secret = await clientSecretForIncompleteSubscription(stripe, subscription)

  await db.collection('checkoutSessions').add({
    userId: opts.userId,
    planId: opts.planId,
    subscriptionId: subscription.id,
    paymentIntentId: secret.paymentIntentId || '',
    gateway: 'stripe',
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  })

  return {
    embedded: true,
    gateway: 'stripe',
    clientSecret: secret.clientSecret,
    publishableKey: config.publishableKey,
    paymentIntentId: secret.paymentIntentId || '',
    subscriptionId: subscription.id,
  }
}

/** One-time card payment — marketplace, events, advertising. */
export async function createEmbeddedPaymentIntent(opts: {
  amountMinor: number
  currency: string
  metadata: Record<string, string>
  description?: string
}): Promise<EmbeddedStripePayload> {
  const stripe = await getStripeClient()
  const config = await resolveStripeConfig()
  if (!config?.publishableKey) {
    throw new Error('Stripe publishable key is not configured.')
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: opts.amountMinor,
    currency: opts.currency.toLowerCase(),
    description: opts.description,
    metadata: opts.metadata,
    automatic_payment_methods: { enabled: false },
    payment_method_types: ['card'],
  })

  if (!paymentIntent.client_secret) {
    throw new Error('Could not initialize card payment.')
  }

  return {
    embedded: true,
    gateway: 'stripe',
    clientSecret: paymentIntent.client_secret,
    publishableKey: config.publishableKey,
    paymentIntentId: paymentIntent.id,
  }
}
