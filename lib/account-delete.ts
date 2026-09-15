import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminApp, getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { isAccountDeleted } from '@/lib/user-settings'

/**
 * Soft-delete the Firestore profile and hard-delete Firebase Auth so the
 * email can be used to register again. Keeps a tombstone for audit/history.
 */
export async function releaseAccountForReregistration(uid: string): Promise<{
  ok: boolean
  authDeleted: boolean
  error?: string
}> {
  const db = getAdminDb()
  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  if (!userSnap.exists) {
    return { ok: false, authDeleted: false, error: 'User not found' }
  }

  const data = userSnap.data() || {}
  const originalEmail = String(data.email || '').trim().toLowerCase()
  const now = Timestamp.now()

  // Stop Stripe renewal so a deleted account is not billed again.
  const stripeSubId = String(data.stripeSubscriptionId || '').trim()
  if (stripeSubId) {
    try {
      const { stripe } = await import('@/lib/stripe-utils')
      if (stripe) {
        try {
          await stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true })
        } catch {
          await stripe.subscriptions.cancel(stripeSubId).catch(() => undefined)
        }
      }
    } catch (err) {
      console.warn('[account-delete] Stripe cancel failed:', err)
    }
  }

  await userRef.set(
    sanitizeForFirestore({
      status: 'deleted',
      active: false,
      accountDeleted: true,
      deletedAt: now,
      updatedAt: now,
      // Free the email for a fresh signup while keeping history.
      email: originalEmail ? `deleted+${uid}@deleted.invalid` : FieldValue.delete(),
      originalEmail: originalEmail || null,
      emailReleasedAt: now,
      membershipAutoRenew: false,
      notificationPreferences: {
        emailNotifications: false,
        pushNotifications: false,
        eventReminders: false,
        memberMessages: false,
        systemAlerts: false,
        newsletter: false,
        communityUpdates: false,
      },
      privacySettings: {
        showProfileToCommunity: false,
        showInMemberDirectory: false,
      },
      newsletterOptOut: true,
      fcmToken: null,
    }),
    { merge: true }
  )

  await db
    .collection('admin-users')
    .doc(uid)
    .set(
      {
        status: 'deleted',
        active: false,
        updatedAt: now,
      },
      { merge: true }
    )
    .catch(() => undefined)

  let authDeleted = false
  try {
    const { getAuth } = await import('firebase-admin/auth')
    await getAuth(getAdminApp()).deleteUser(uid)
    authDeleted = true
  } catch (authError: unknown) {
    const code = (authError as { code?: string })?.code
    if (code === 'auth/user-not-found') {
      authDeleted = true
    } else {
      console.warn('[account-delete] Auth delete failed, disabling instead:', authError)
      try {
        const { getAuth } = await import('firebase-admin/auth')
        await getAuth(getAdminApp()).updateUser(uid, { disabled: true })
      } catch (disableErr) {
        console.warn('[account-delete] Auth disable also failed:', disableErr)
      }
    }
  }

  return { ok: true, authDeleted }
}

/** True when a Firestore user row should not block email re-registration. */
export function firestoreEmailIsReleased(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return true
  if (isAccountDeleted(data as { status?: string; active?: boolean; accountDeleted?: boolean })) {
    return true
  }
  const email = String(data.email || '').toLowerCase()
  if (email.endsWith('@deleted.invalid') || email.startsWith('deleted+')) return true
  return false
}
