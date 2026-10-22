/** Client-side admin MFA session after email OTP (step 3). */

export const ADMIN_MFA_STORAGE_KEY = 'pb_admin_mfa_v1'
export const ADMIN_MFA_TTL_MS = 30 * 24 * 60 * 60 * 1000

function writeStored(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

function readStored(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

export function setAdminMfaSession(uid: string): void {
  if (typeof window === 'undefined') return
  const payload = JSON.stringify({
    uid,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + ADMIN_MFA_TTL_MS,
  })
  // localStorage survives closing the phone app, so a saved login lasts 30 days.
  writeStored(localStorage, ADMIN_MFA_STORAGE_KEY, payload)
  writeStored(sessionStorage, ADMIN_MFA_STORAGE_KEY, payload)
  writeStored(localStorage, 'pb_remember_until', String(Date.now() + ADMIN_MFA_TTL_MS))
}

export function clearAdminMfaSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(ADMIN_MFA_STORAGE_KEY)
    localStorage.removeItem(ADMIN_MFA_STORAGE_KEY)
    localStorage.removeItem('pb_remember_until')
  } catch {
    /* ignore */
  }
}

export function hasValidAdminMfaSession(uid: string): boolean {
  if (typeof window === 'undefined') return false
  const raw =
    readStored(localStorage, ADMIN_MFA_STORAGE_KEY) ||
    readStored(sessionStorage, ADMIN_MFA_STORAGE_KEY)
  if (!raw) return false
  try {
    const data = JSON.parse(raw) as { uid?: string; expiresAt?: number }
    if (!data?.uid || data.uid !== uid) return false
    if (!data.expiresAt || data.expiresAt < Date.now()) {
      clearAdminMfaSession()
      return false
    }
    return true
  } catch {
    return false
  }
}
