import Stripe from 'stripe'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

export interface StripeHostingConfig {
  secretKey: string
  publishableKey: string
  webhookSecret?: string
  mode: string
}

/**
 * Separate Stripe account/keys for platform hosting payments.
 * Priority: env vars → Integrations vault "Stripe (Hosting)".
 * Never uses the main membership/donation Stripe credentials.
 */
export async function resolveStripeHostingConfig(): Promise<StripeHostingConfig | null> {
  const envSecret =
    process.env.STRIPE_HOSTING_SECRET_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY_HOSTING?.trim() ||
    ''
  const envPublishable =
    process.env.NEXT_PUBLIC_STRIPE_HOSTING_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_HOSTING_PUBLISHABLE_KEY?.trim() ||
    ''

  if (envSecret && envPublishable) {
    return {
      secretKey: envSecret,
      publishableKey: envPublishable,
      webhookSecret: process.env.STRIPE_HOSTING_WEBHOOK_SECRET?.trim() || undefined,
      mode: process.env.STRIPE_HOSTING_MODE?.trim() || 'live',
    }
  }

  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'stripeHosting')
    const secretKey = integration?.credentials?.secretKey
    const publishableKey = integration?.credentials?.publishableKey
    if (
      typeof secretKey === 'string' &&
      secretKey.trim() &&
      typeof publishableKey === 'string' &&
      publishableKey.trim()
    ) {
      return {
        secretKey: secretKey.trim(),
        publishableKey: publishableKey.trim(),
        webhookSecret:
          typeof integration.credentials.webhookSecret === 'string'
            ? integration.credentials.webhookSecret.trim()
            : undefined,
        mode:
          typeof integration.credentials.mode === 'string'
            ? integration.credentials.mode
            : 'live',
      }
    }
  } catch (error) {
    console.warn('[stripe-hosting] Could not load integration credentials:', error)
  }

  return null
}

let cachedClient: Stripe | null = null
let cachedKey: string | null = null

export async function getStripeHostingClient(): Promise<Stripe> {
  const config = await resolveStripeHostingConfig()
  if (!config) {
    throw new Error(
      'Hosting Stripe is not configured. Add Stripe (Hosting) under Admin → Integrations, or set STRIPE_HOSTING_SECRET_KEY and NEXT_PUBLIC_STRIPE_HOSTING_PUBLISHABLE_KEY.'
    )
  }
  if (cachedClient && cachedKey === config.secretKey) return cachedClient
  cachedClient = new Stripe(config.secretKey, { apiVersion: '2024-04-10' })
  cachedKey = config.secretKey
  return cachedClient
}
