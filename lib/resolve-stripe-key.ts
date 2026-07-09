import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

export interface StripeConfig {
  secretKey: string
  publishableKey?: string
  webhookSecret?: string
  mode?: string
}

/** Resolve Stripe credentials: env override, then encrypted integrations store. */
export async function resolveStripeConfig(): Promise<StripeConfig | null> {
  const envSecret = process.env.STRIPE_SECRET_KEY
  if (typeof envSecret === 'string' && envSecret.trim()) {
    return {
      secretKey: envSecret.trim(),
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim(),
      mode: process.env.STRIPE_MODE || 'test',
    }
  }

  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'stripe')
    const secretKey = integration?.credentials?.secretKey
    if (typeof secretKey === 'string' && secretKey.trim()) {
      return {
        secretKey: secretKey.trim(),
        publishableKey:
          typeof integration.credentials.publishableKey === 'string'
            ? integration.credentials.publishableKey.trim()
            : undefined,
        webhookSecret:
          typeof integration.credentials.webhookSecret === 'string'
            ? integration.credentials.webhookSecret.trim()
            : undefined,
        mode:
          typeof integration.credentials.mode === 'string'
            ? integration.credentials.mode
            : 'test',
      }
    }
  } catch (error) {
    console.warn('[stripe] Could not load integration credentials:', error)
  }

  return null
}
