import { getIntegrationServer } from '@/lib/integrations/handlers-server'

import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

/** Current Haiku snapshot. claude-3-5-haiku-20241022 was retired 19 Feb 2026. */
export const DEFAULT_ANTHROPIC_CHAT_MODEL = 'claude-haiku-4-5-20251001'

/** Current Sonnet used by admin copy tools. claude-3-5-sonnet-20241022 is retired. */
export const DEFAULT_ANTHROPIC_SONNET_MODEL = 'claude-sonnet-4-6'

const RETIRED_ANTHROPIC_MODELS = new Set([
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-7-sonnet-20250219',
  'claude-3-opus-20240229',
])

/** Replace a blank or retired model id so a saved old value does not 404. */
export function toActiveAnthropicModel(
  model: string | null | undefined,
  fallback: string = DEFAULT_ANTHROPIC_CHAT_MODEL
): string {
  const id = String(model || '').trim()
  if (!id || RETIRED_ANTHROPIC_MODELS.has(id)) return fallback
  return id
}

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
      return toActiveAnthropicModel(model)
    }
  } catch (error) {
    console.warn('[v0] Could not load Anthropic model setting:', error)
  }
  return null
}
