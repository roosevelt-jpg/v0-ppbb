import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export const ADMIN_ACCESS_CODES_COLLECTION = 'adminAccessCodes'

/** Unused invites are deleted this long after creation (not just after code expiry). */
export const UNUSED_INVITE_RETENTION_MS = 48 * 60 * 60 * 1000

export type AdminInviteRecord = {
  id: string
  code: string
  adminEmail: string
  adminName: string
  adminRole: string
  permissions: string[]
  isUsed: boolean
  redeemedUserId?: string | null
  expiresAt?: Date | null
  createdAt?: Date | null
}

export function normalizeInviteEmail(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function inviteIsUsed(data: Record<string, unknown>): boolean {
  return data.isUsed === true || data.used === true || data.status === 'used'
}

export function parseInviteExpiresAt(data: Record<string, unknown>): Date | null {
  const raw = data.expiresAt
  if (!raw) return null
  if (typeof (raw as { toDate?: () => Date }).toDate === 'function') {
    return (raw as { toDate: () => Date }).toDate()
  }
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? null : d
}

export function parseInviteCreatedAt(data: Record<string, unknown>): Date | null {
  const raw = data.createdAt
  if (!raw) return null
  if (typeof (raw as { toDate?: () => Date }).toDate === 'function') {
    return (raw as { toDate: () => Date }).toDate()
  }
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Unused invite past the 48h retention window.
 * Prefers createdAt; if missing, uses expiresAt + 24h (typical invite is create+24h expiry).
 */
export function isUnusedInvitePastRetention(
  data: Record<string, unknown>,
  now = new Date()
): boolean {
  if (inviteIsUsed(data)) return false
  const createdAt = parseInviteCreatedAt(data)
  if (createdAt) {
    return now.getTime() - createdAt.getTime() >= UNUSED_INVITE_RETENTION_MS
  }
  const expiresAt = parseInviteExpiresAt(data)
  if (expiresAt) {
    return now.getTime() - expiresAt.getTime() >= 24 * 60 * 60 * 1000
  }
  return false
}

/** Delete unused invites older than 48 hours. Returns how many docs were removed. */
export async function purgeStaleUnusedAccessCodes(now = new Date()): Promise<number> {
  const snap = await getAdminDb().collection(ADMIN_ACCESS_CODES_COLLECTION).get()
  const stale = snap.docs.filter((docSnap) =>
    isUnusedInvitePastRetention(docSnap.data() as Record<string, unknown>, now)
  )
  if (stale.length === 0) return 0

  const db = getAdminDb()
  let deleted = 0
  for (let i = 0; i < stale.length; i += 400) {
    const chunk = stale.slice(i, i + 400)
    const batch = db.batch()
    for (const docSnap of chunk) {
      batch.delete(docSnap.ref)
      deleted += 1
    }
    await batch.commit()
  }
  return deleted
}

export function mapInviteDoc(
  id: string,
  data: Record<string, unknown>,
  codeFallback = ''
): AdminInviteRecord {
  return {
    id,
    code: String(data.code || codeFallback || '').toUpperCase(),
    adminEmail: normalizeInviteEmail(data.adminEmail || data.email),
    adminName: String(data.adminName || ''),
    adminRole: String(data.adminRole || data.role || 'admin'),
    permissions: Array.isArray(data.permissions) ? (data.permissions as string[]) : ['full_access'],
    isUsed: inviteIsUsed(data),
    redeemedUserId:
      typeof data.redeemedUserId === 'string' ? data.redeemedUserId : null,
    expiresAt: parseInviteExpiresAt(data),
    createdAt: parseInviteCreatedAt(data),
  }
}

export async function findInviteByCode(code: string): Promise<AdminInviteRecord | null> {
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) return null
  const snap = await getAdminDb()
    .collection(ADMIN_ACCESS_CODES_COLLECTION)
    .where('code', '==', normalized)
    .limit(1)
    .get()
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  const data = docSnap.data() as Record<string, unknown>
  if (isUnusedInvitePastRetention(data)) {
    await docSnap.ref.delete().catch(() => undefined)
    return null
  }
  return mapInviteDoc(docSnap.id, data, normalized)
}

export async function findInviteById(codeId: string): Promise<AdminInviteRecord | null> {
  if (!codeId) return null
  const snap = await getAdminDb().collection(ADMIN_ACCESS_CODES_COLLECTION).doc(codeId).get()
  if (!snap.exists) return null
  const data = snap.data() as Record<string, unknown>
  if (isUnusedInvitePastRetention(data)) {
    await snap.ref.delete().catch(() => undefined)
    return null
  }
  return mapInviteDoc(snap.id, data)
}

export async function userProfileExists(uid: string): Promise<boolean> {
  const snap = await getAdminDb().collection('users').doc(uid).get()
  return snap.exists
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalized = normalizeInviteEmail(email)
  if (!normalized) return null
  const snap = await getAdminDb()
    .collection('users')
    .where('email', '==', normalized)
    .limit(1)
    .get()
  if (!snap.empty) return snap.docs[0].id
  return null
}

/**
 * Create/merge the Auth-linked users/{uid} profile + admin mirror docs.
 * Must run via Admin SDK — client rules block creating admin roles.
 */
export async function upsertAdminUserProfile(input: {
  uid: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role: string
  permissions: string[]
  accessCodeId?: string | null
}): Promise<void> {
  const db = getAdminDb()
  const email = normalizeInviteEmail(input.email)
  const name =
    (input.name && input.name.trim()) ||
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() ||
    email.split('@')[0] ||
    'Admin'
  const parts = name.split(/\s+/)
  const firstName = (input.firstName && input.firstName.trim()) || parts[0] || 'Admin'
  const lastName =
    (input.lastName && input.lastName.trim()) || parts.slice(1).join(' ') || 'User'
  const now = new Date()
  const existingUserSnap = await db.collection('users').doc(input.uid).get()
  const existingUser = existingUserSnap.exists

  await db
    .collection('users')
    .doc(input.uid)
    .set(
      sanitizeForFirestore({
        id: input.uid,
        email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        role: input.role,
        roles: [input.role],
        permissions: input.permissions,
        active: true,
        status: 'active',
        updatedAt: now,
        ...(existingUser ? {} : { createdAt: now }),
      }),
      { merge: true }
    )

  const existingAdminSnap = await db.collection('admin-users').doc(input.uid).get()
  await db
    .collection('admin-users')
    .doc(input.uid)
    .set(
      sanitizeForFirestore({
        email,
        name: `${firstName} ${lastName}`.trim(),
        role: input.role,
        permissions: input.permissions,
        status: 'active',
        updatedAt: now,
        ...(existingAdminSnap.exists ? {} : { createdAt: now, lastLogin: null }),
        accessCodeId: input.accessCodeId || null,
      }),
      { merge: true }
    )

  await db
    .collection('adminUsers')
    .doc(input.uid)
    .set(
      sanitizeForFirestore({
        email,
        role: input.role,
        permissions: input.permissions,
        active: true,
        updatedAt: now,
      }),
      { merge: true }
    )
}

export async function markInviteUsed(input: {
  codeId: string
  email: string
  userId: string
}): Promise<void> {
  await getAdminDb()
    .collection(ADMIN_ACCESS_CODES_COLLECTION)
    .doc(input.codeId)
    .update(
      sanitizeForFirestore({
        isUsed: true,
        used: true,
        status: 'used',
        usedBy: normalizeInviteEmail(input.email),
        usedAt: new Date(),
        redeemedUserId: input.userId,
        updatedAt: FieldValue.serverTimestamp(),
      })
    )
}
