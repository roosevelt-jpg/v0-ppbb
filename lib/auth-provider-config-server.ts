import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'

export type AuthProviderPublicConfig = {
  google: { enabled: boolean; configured: boolean }
  facebook: { enabled: boolean; configured: boolean }
}

/**
 * Google: on by default (Firebase Console does the real OAuth).
 * Hide only when the Integrations row is set to Inactive.
 */
function googleSignInEnabled(
  integration: Awaited<ReturnType<typeof getIntegrationServer>>
): boolean {
  if (!integration) return true
  return integration.status !== 'inactive'
}

/** Which social login providers are available on public login/signup. */
export async function getAuthProviderPublicConfig(): Promise<AuthProviderPublicConfig> {
  const googleIntegration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'googleAuth').catch(
    () => null
  )

  const googleConfigured = Boolean(googleIntegration?.credentials?.webClientId?.trim())

  // Facebook Login is disabled site-wide until Meta app review / Firebase provider is fixed.
  return {
    google: {
      configured: googleConfigured,
      enabled: googleSignInEnabled(googleIntegration),
    },
    facebook: {
      configured: false,
      enabled: false,
    },
  }
}
