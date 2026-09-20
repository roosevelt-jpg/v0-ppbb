/**
 * Firestore-backed cooldown so noisy automated emails do not flood Gmail.
 * Returns true if this send is allowed (and records the claim).
 */

import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'

export const EMAIL_COOLDOWN = {
  /** Sign-in security alerts */
  LOGIN_ALERT_MS: 24 * 60 * 60 * 1000,
  /** Direct-message email digests (push still fires every time) */
  DM_EMAIL_MS: 6 * 60 * 60 * 1000,
  /** One welcome email per community forever (practically) */
  COMMUNITY_WELCOME_MS: 365 * 24 * 60 * 60 * 1000,
  /** One welcome email per group forever */
  GROUP_WELCOME_MS: 365 * 24 * 60 * 60 * 1000,
  /** Cap "new member joined" emails to group owners */
  GROUP_OWNER_NEW_MEMBER_MS: 60 * 60 * 1000,
  /** Generic in-app→email fanout from group admin actions */
  GROUP_ADMIN_NOTIFY_MS: 30 * 60 * 1000,
} as const

function throttleDocId(userId: string, bucket: string): string {
  const raw = `${userId}__${bucket}`
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 700)
}

/**
 * Claim a send slot. Concurrent callers: at most one wins inside the cooldown window.
 * On Firestore errors, fails open (allows send) so critical mail is not blocked.
 */
export async function claimEmailSlot(opts: {
  userId: string
  bucket: string
  cooldownMs: number
}): Promise<{ allowed: boolean; reason?: string }> {
  const userId = String(opts.userId || '').trim()
  const bucket = String(opts.bucket || '').trim().slice(0, 180)
  const cooldownMs = Math.max(0, Number(opts.cooldownMs) || 0)

  if (!userId || !bucket || cooldownMs <= 0) {
    return { allowed: true }
  }

  try {
    const ref = getAdminDb().collection('emailThrottle').doc(throttleDocId(userId, bucket))
    const allowed = await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const now = Date.now()
      const last = snap.exists ? Number(snap.data()?.lastSentAtMs || 0) : 0
      if (last > 0 && now - last < cooldownMs) {
        return false
      }
      tx.set(
        ref,
        {
          userId,
          bucket,
          lastSentAtMs: now,
          cooldownMs,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      return true
    })

    if (!allowed) {
      return { allowed: false, reason: `throttled:${bucket}` }
    }
    return { allowed: true }
  } catch (error) {
    console.warn(
      '[email-throttle] claim failed (allowing send):',
      error instanceof Error ? error.message : error
    )
    return { allowed: true, reason: 'throttle-error-fail-open' }
  }
}
