import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

export interface PayPalConfig {
  clientId: string
  clientSecret: string
  mode: 'sandbox' | 'live'
}

/** Resolve PayPal credentials: env override, then encrypted integrations store. */
export async function resolvePayPalConfig(): Promise<PayPalConfig | null> {
  const envId = process.env.PAYPAL_CLIENT_ID?.trim()
  const envSecret = process.env.PAYPAL_CLIENT_SECRET?.trim()
  if (envId && envSecret) {
    const mode =
      process.env.PAYPAL_MODE === 'live' || process.env.PAYPAL_MODE === 'sandbox'
        ? process.env.PAYPAL_MODE
        : envId.includes('sandbox') || process.env.NODE_ENV !== 'production'
          ? 'sandbox'
          : 'live'
    return { clientId: envId, clientSecret: envSecret, mode }
  }

  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'paypal')
    const clientId = integration?.credentials?.clientId
    const clientSecret = integration?.credentials?.clientSecret
    if (typeof clientId === 'string' && clientId.trim() && typeof clientSecret === 'string' && clientSecret.trim()) {
      const modeRaw = integration.credentials.mode
      const mode = modeRaw === 'live' ? 'live' : 'sandbox'
      return {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        mode,
      }
    }
  } catch (error) {
    console.warn('[paypal] Could not load integration credentials:', error)
  }

  return null
}

export function paypalApiBase(mode: 'sandbox' | 'live'): string {
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}
