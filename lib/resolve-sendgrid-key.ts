import { getIntegrationServer } from '@/lib/integrations/handlers-server'

import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

export interface SendGridConfig {
  apiKey: string
  fromAddress: string
  fromName: string
}

/** Resolve SendGrid credentials: env override, then encrypted integrations store. */
export async function resolveSendGridConfig(): Promise<SendGridConfig | null> {
  const envKey = process.env.SENDGRID_API_KEY
  const envFrom = process.env.SENDGRID_FROM_ADDRESS

  if (typeof envKey === 'string' && envKey.trim()) {
    return {
      apiKey: envKey.trim(),
      fromAddress: (envFrom || 'noreply@passiveblessings.ae').trim(),
      fromName: 'Passive Blessings',
    }
  }

  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'sendgrid')
    const apiKey = integration?.credentials?.apiKey
    const fromAddress = integration?.credentials?.fromAddress
    if (typeof apiKey === 'string' && apiKey.trim() && typeof fromAddress === 'string' && fromAddress.trim()) {
      return {
        apiKey: apiKey.trim(),
        fromAddress: fromAddress.trim(),
        fromName: 'Passive Blessings',
      }
    }
  } catch (error) {
    console.warn('[v0] Could not load SendGrid integration:', error)
  }

  return null
}
