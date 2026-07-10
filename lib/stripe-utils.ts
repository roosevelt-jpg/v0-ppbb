import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY

// Initialize Stripe only if key is available
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2024-04-10',
}) : null

export { stripe }

// Helper functions for subscription management

export async function createCheckoutSession(params: {
  customerId?: string
  email: string
  amount: number
  currency: string
  causeName: string
  causeId: string
  interval: 'month' | 'year'
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) throw new Error('Stripe not configured')
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: params.interval ? 'subscription' : 'payment',
    customer_email: params.email,
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: `Donation to ${params.causeName}`,
            description: `Monthly recurring donation via Passive Blessings`,
            metadata: {
              causeId: params.causeId,
              causeName: params.causeName,
            },
          },
          recurring: params.interval
            ? {
                interval: params.interval,
                interval_count: 1,
              }
            : undefined,
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      causeId: params.causeId,
      causeName: params.causeName,
    },
  })

  return session
}

export async function getSubscription(subscriptionId: string) {
  if (!stripe) throw new Error('Stripe not configured')
  return await stripe.subscriptions.retrieve(subscriptionId)
}

export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) throw new Error('Stripe not configured')
  return await stripe.subscriptions.cancel(subscriptionId)
}

export async function pauseSubscription(subscriptionId: string) {
  if (!stripe) throw new Error('Stripe not configured')
  return await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: 'keep_as_draft',
    },
  })
}

export async function resumeSubscription(subscriptionId: string) {
  if (!stripe) throw new Error('Stripe not configured')
  return await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {},
  })
}

export async function getCustomerSubscriptions(customerId: string) {
  if (!stripe) throw new Error('Stripe not configured')
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 100,
  })

  return subscriptions.data
}

export function constructWebhookEvent(body: Buffer, signature: string) {
  if (!stripe) throw new Error('Stripe not configured')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  if (!webhookSecret) throw new Error('Stripe webhook secret not configured')
  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}

export async function constructWebhookEventAsync(body: Buffer, signature: string) {
  const { resolveStripeConfig } = await import('@/lib/resolve-stripe-key')
  const config = await resolveStripeConfig()
  if (!config?.secretKey || !config.webhookSecret) {
    throw new Error('Stripe webhook secret not configured')
  }
  const client = new Stripe(config.secretKey, { apiVersion: '2024-04-10' })
  return client.webhooks.constructEvent(body, signature, config.webhookSecret)
}
