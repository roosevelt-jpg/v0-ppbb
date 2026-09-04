import { getIntegrationServer } from '@/lib/integrations/handlers-server'

import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

/** Resolve Anthropic API key: Integrations vault first, then env override. */
export async function resolveAnthropicApiKey(): Promise<string | null> {
  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'anthropic')
    const apiKey = integration?.credentials?.apiKey
    if (typeof apiKey === 'string' && apiKey.trim()) {
      return apiKey.trim()
    }
  } catch (error) {
    console.warn('[v0] Could not load Anthropic integration:', error)
  }

  const envKey = process.env.ANTHROPIC_API_KEY
  if (typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim()
  }

  return null
}

/** Optional chat model from integrations (defaults to Haiku). */
export async function resolveAnthropicModel(): Promise<string | null> {
  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'anthropic')
    const model = integration?.credentials?.model
    if (typeof model === 'string' && model.trim()) {
      return model.trim()
    }
  } catch (error) {
    console.warn('[v0] Could not load Anthropic model setting:', error)
  }
  return null
}
