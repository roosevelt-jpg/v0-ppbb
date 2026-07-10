import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

export interface ZiinaConfig {
  /** Bearer token for Ziina Payment Intent API */
  apiToken: string
  testMode: boolean
}

/** Resolve Ziina credentials: env override, then encrypted integrations store. */
export async function resolveZiinaConfig(): Promise<ZiinaConfig | null> {
  const envToken =
    process.env.ZIINA_API_KEY?.trim() ||
    process.env.ZIINA_PRIVATE_KEY?.trim() ||
    process.env.ZIINA_API_SECRET?.trim()
  if (envToken) {
    return {
      apiToken: envToken,
      testMode: process.env.ZIINA_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production',
    }
  }

  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'ziina')
    const apiKey = integration?.credentials?.apiKey
    const apiSecret = integration?.credentials?.apiSecret
    const token =
      (typeof apiKey === 'string' && apiKey.trim()) ||
      (typeof apiSecret === 'string' && apiSecret.trim()) ||
      ''
    if (token) {
      return {
        apiToken: token,
        testMode: process.env.ZIINA_TEST_MODE === 'true',
      }
    }
  } catch (error) {
    console.warn('[ziina] Could not load integration credentials:', error)
  }

  return null
}

export const ZIINA_API_BASE = 'https://api-v2.ziina.com/api'
