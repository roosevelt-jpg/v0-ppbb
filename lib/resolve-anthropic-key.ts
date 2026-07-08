import { getIntegrationServer } from '@/lib/integrations/handlers-server'

const DEFAULT_INTEGRATION_USER_ID = 'dev-user-001'

/** Resolve Anthropic API key: env override, then encrypted integrations store. */
export async function resolveAnthropicApiKey(): Promise<string | null> {
  const envKey = process.env.ANTHROPIC_API_KEY
  if (typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim()
  }

  try {
    const integration = await getIntegrationServer(DEFAULT_INTEGRATION_USER_ID, 'anthropic')
    const apiKey = integration?.credentials?.apiKey
    if (typeof apiKey === 'string' && apiKey.trim()) {
      return apiKey.trim()
    }
  } catch (error) {
    console.warn('[v0] Could not load Anthropic integration:', error)
  }

  return null
}
