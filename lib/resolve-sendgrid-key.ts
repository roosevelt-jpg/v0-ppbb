import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import {
  DEFAULT_MAIL_FROM,
  DEFAULT_MAIL_FROM_NAME,
  DEFAULT_MAIL_REPLY_TO,
  canonicalizeMailAddress,
} from '@/lib/mail-identity'

export interface SendGridConfig {
  apiKey: string
  fromAddress: string
  fromName: string
  replyTo: string
}

/** Resolve SendGrid credentials: env override, then encrypted integrations store. */
export async function resolveSendGridConfig(): Promise<SendGridConfig | null> {
  const envKey = process.env.SENDGRID_API_KEY
  const envFrom = process.env.SENDGRID_FROM_ADDRESS
  const envReply = process.env.SENDGRID_REPLY_TO || process.env.MAIL_REPLY_TO

  if (typeof envKey === 'string' && envKey.trim()) {
    return {
      apiKey: envKey.trim(),
      fromAddress: canonicalizeMailAddress(envFrom || DEFAULT_MAIL_FROM),
      fromName: process.env.SENDGRID_FROM_NAME?.trim() || DEFAULT_MAIL_FROM_NAME,
      replyTo: canonicalizeMailAddress(envReply || DEFAULT_MAIL_REPLY_TO),
    }
  }

  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'sendgrid')
    const apiKey = integration?.credentials?.apiKey
    const fromAddress = integration?.credentials?.fromAddress
    if (typeof apiKey === 'string' && apiKey.trim() && typeof fromAddress === 'string' && fromAddress.trim()) {
      const replyFromIntegration = integration?.credentials?.replyTo
      return {
        apiKey: apiKey.trim(),
        fromAddress: canonicalizeMailAddress(fromAddress),
        fromName: DEFAULT_MAIL_FROM_NAME,
        replyTo: canonicalizeMailAddress(replyFromIntegration || envReply || DEFAULT_MAIL_REPLY_TO),
      }
    }
  } catch (error) {
    console.warn('[v0] Could not load SendGrid integration:', error)
  }

  return null
}
