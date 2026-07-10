import crypto from 'crypto'
import { getAdminDb } from '@/lib/firebase-admin'

const VAULT_DOC = 'platformConfig/integrationsVault'
const UNLOCK_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours

function vaultSigningKey(): string {
  return (
    process.env.INTEGRATION_ENCRYPTION_KEY ||
    process.env.INTEGRATIONS_VAULT_SECRET ||
    'default-dev-key-change-in-prod-32chars!!'
  )
}

export type IntegrationsVaultSettings = {
  enabled: boolean
  passcodeHash: string | null
  updatedAt?: string
  updatedBy?: string
}

export async function getIntegrationsVaultSettings(): Promise<IntegrationsVaultSettings> {
  try {
    const snap = await getAdminDb().doc(VAULT_DOC).get()
    if (!snap.exists) {
      return { enabled: false, passcodeHash: null }
    }
    const data = snap.data() || {}
    const hash = typeof data.passcodeHash === 'string' ? data.passcodeHash : null
    return {
      enabled: Boolean(data.enabled) && Boolean(hash),
      passcodeHash: hash,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || undefined,
      updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
    }
  } catch (e) {
    console.warn('[integrations-vault] read failed:', e)
    return { enabled: false, passcodeHash: null }
  }
}

export function hashPasscode(passcode: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(passcode, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPasscode(passcode: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const actual = crypto.scryptSync(passcode, salt, 64)
    if (expected.length !== actual.length) return false
    return crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

export async function setIntegrationsVaultPasscode(
  passcode: string,
  updatedBy: string
): Promise<void> {
  const trimmed = passcode.trim()
  if (trimmed.length < 6) {
    throw new Error('Passcode must be at least 6 characters')
  }
  const { FieldValue } = await import('firebase-admin/firestore')
  await getAdminDb()
    .doc(VAULT_DOC)
    .set(
      {
        enabled: true,
        passcodeHash: hashPasscode(trimmed),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy,
      },
      { merge: true }
    )
}

export async function clearIntegrationsVaultPasscode(updatedBy: string): Promise<void> {
  const { FieldValue } = await import('firebase-admin/firestore')
  await getAdminDb()
    .doc(VAULT_DOC)
    .set(
      {
        enabled: false,
        passcodeHash: null,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy,
      },
      { merge: true }
    )
}

export function createIntegrationsUnlockToken(uid: string): string {
  const exp = Date.now() + UNLOCK_TTL_MS
  const payload = `${uid}.${exp}`
  const sig = crypto.createHmac('sha256', vaultSigningKey()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyIntegrationsUnlockToken(
  token: string | null | undefined,
  uid: string
): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [tokenUid, expStr, sig] = parts
  if (tokenUid !== uid) return false
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return false
  const payload = `${tokenUid}.${expStr}`
  const expected = crypto.createHmac('sha256', vaultSigningKey()).update(payload).digest('hex')
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function getUnlockTokenFromRequest(request: {
  headers: { get(name: string): string | null }
}): string | null {
  return (
    request.headers.get('x-integrations-unlock') ||
    request.headers.get('X-Integrations-Unlock') ||
    null
  )
}
