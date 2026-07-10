/** Client helpers for Integrations vault unlock token (sessionStorage). */

export const INTEGRATIONS_UNLOCK_KEY = 'pb_integrations_unlock'

export function getIntegrationsUnlockToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(INTEGRATIONS_UNLOCK_KEY)
  } catch {
    return null
  }
}

export function setIntegrationsUnlockToken(token: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(INTEGRATIONS_UNLOCK_KEY, token)
  } catch {
    /* ignore */
  }
}

export function clearIntegrationsUnlockToken() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(INTEGRATIONS_UNLOCK_KEY)
  } catch {
    /* ignore */
  }
}

export function integrationsVaultHeaders(bearerToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${bearerToken}`,
  }
  const unlock = getIntegrationsUnlockToken()
  if (unlock) headers['X-Integrations-Unlock'] = unlock
  return headers
}
