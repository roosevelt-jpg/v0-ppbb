/** Client-side admin MFA session after email OTP (step 3). */

export const ADMIN_MFA_STORAGE_KEY = 'pb_admin_mfa_v1'
export const ADMIN_MFA_TTL_MS = 30 * 24 * 60 * 60 * 1000

export function setAdminMfaSession(uid: string): void {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      uid,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + ADMIN_MFA_TTL_MS,
    }
    sessionStorage.setItem(ADMIN_MFA_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export function clearAdminMfaSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(ADMIN_MFA_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function hasValidAdminMfaSession(uid: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = sessionStorage.getItem(ADMIN_MFA_STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw) as { uid?: string; expiresAt?: number }
    if (!data?.uid || data.uid !== uid) return false
    if (!data.expiresAt || data.expiresAt < Date.now()) {
      sessionStorage.removeItem(ADMIN_MFA_STORAGE_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}
