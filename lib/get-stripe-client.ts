import Stripe from 'stripe'
import { resolveStripeConfig } from '@/lib/resolve-stripe-key'

let cachedClient: Stripe | null = null
let cachedKey: string | null = null

export async function getStripeClient(): Promise<Stripe> {
  const config = await resolveStripeConfig()
  if (!config?.secretKey) {
    throw new Error('Stripe is not configured. Add keys in Admin → Integrations or set STRIPE_SECRET_KEY.')
  }

  if (cachedClient && cachedKey === config.secretKey) {
    return cachedClient
  }

  cachedClient = new Stripe(config.secretKey, {
    apiVersion: '2024-04-10',
  })
  cachedKey = config.secretKey
  return cachedClient
}

export async function getStripeWebhookSecret(): Promise<string> {
  const config = await resolveStripeConfig()
  if (!config?.webhookSecret) {
    throw new Error('Stripe webhook secret is not configured.')
  }
  return config.webhookSecret
}
