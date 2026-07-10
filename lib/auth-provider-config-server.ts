import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

export type AuthProviderPublicConfig = {
  google: { enabled: boolean; configured: boolean }
  facebook: { enabled: boolean; configured: boolean }
}

function isTruthyFlag(value: unknown): boolean {
  if (value === true || value === 'true' || value === '1' || value === 'on') return true
  if (value === false || value === 'false' || value === '0' || value === 'off') return false
  return true
}

function integrationEnabled(
  integration: Awaited<ReturnType<typeof getIntegrationServer>>,
  configured: boolean
): boolean {
  // No integration saved yet — allow Firebase Console config to work out of the box.
  if (!integration) return true
  if (!configured) return false
  if (integration.status !== 'active') return false
  const creds = integration.credentials || {}
  return isTruthyFlag(creds.enabled ?? true)
}

/** Which social login providers are configured via Admin > Integrations. */
export async function getAuthProviderPublicConfig(): Promise<AuthProviderPublicConfig> {
  const [googleIntegration, facebookIntegration] = await Promise.all([
    getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'googleAuth').catch(() => null),
    getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'facebookAuth').catch(() => null),
  ])

  const googleConfigured = Boolean(googleIntegration?.credentials?.webClientId?.trim())
  const facebookConfigured = Boolean(facebookIntegration?.credentials?.appId?.trim())

  return {
    google: {
      configured: googleConfigured,
      enabled: integrationEnabled(googleIntegration, googleConfigured || !googleIntegration),
    },
    facebook: {
      configured: facebookConfigured,
      enabled: integrationEnabled(facebookIntegration, facebookConfigured || !facebookIntegration),
    },
  }
}
