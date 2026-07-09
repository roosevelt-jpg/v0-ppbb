import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { getReferralsPlatformConfig } from '@/lib/referral-code-server'

export type ResolvedReferralBusiness = {
  businessId: string
  referralCode: string
  businessName: string
  contributionPercent: number
}

export async function resolveBusinessFromReferralCode(
  db: Firestore,
  code: string
): Promise<ResolvedReferralBusiness | null> {
  const trimmed = String(code || '').trim()
  if (!trimmed) return null

  const snap = await db
    .collection('businesses')
    .where('referralCode', '==', trimmed)
    .limit(1)
    .get()

  if (snap.empty) return null

  const doc = snap.docs[0]
  const data = doc.data()
  if (data.isApproved !== true || data.isActive === false) return null

  const config = await getReferralsPlatformConfig(db)
  const contributionPercent =
    typeof data.referralContributionPercent === 'number'
      ? data.referralContributionPercent
      : typeof data.referralPercent === 'number'
        ? data.referralPercent
        : config.defaultContributionPercent

  return {
    businessId: doc.id,
    referralCode: trimmed,
    businessName:
      (typeof data.name === 'string' && data.name) ||
      (typeof data.businessName === 'string' && data.businessName) ||
      'Business',
    contributionPercent,
  }
}

export type UserReferralAttribution = {
  referralCode: string
  businessId: string
  businessName: string
  attributedAt: Date
}

export async function getUserReferralAttribution(
  userId: string
): Promise<UserReferralAttribution | null> {
  const db = getAdminDb()
  const snap = await db.collection('users').doc(userId).get()
  if (!snap.exists) return null

  const data = snap.data() || {}
  const code = String(data.attributedReferralCode || '').trim()
  const businessId = String(data.attributedReferralBusinessId || '').trim()
  if (!code || !businessId) return null

  const at = data.attributedReferralAt
  let attributedAt = new Date()
  if (at && typeof at === 'object' && 'toDate' in at && typeof at.toDate === 'function') {
    attributedAt = at.toDate()
  } else if (at instanceof Date) {
    attributedAt = at
  }

  return {
    referralCode: code,
    businessId,
    businessName: String(data.attributedReferralBusinessName || 'Business'),
    attributedAt,
  }
}

/**
 * First-touch attribution — never overwrites an existing referral on the user.
 */
export async function persistUserReferralAttribution(
  userId: string,
  referralCode: string
): Promise<{ saved: boolean; businessId?: string }> {
  const code = String(referralCode || '').trim()
  if (!code || !userId) return { saved: false }

  const db = getAdminDb()
  const userRef = db.collection('users').doc(userId)
  const userSnap = await userRef.get()
  if (!userSnap.exists) return { saved: false }

  const existing = userSnap.data() || {}
  if (String(existing.attributedReferralCode || '').trim()) {
    return { saved: false, businessId: String(existing.attributedReferralBusinessId || '') || undefined }
  }

  const business = await resolveBusinessFromReferralCode(db, code)
  if (!business) return { saved: false }

  // Self-referral: business owner clicking their own link
  if (business.businessId === userId) return { saved: false }

  await userRef.set(
    sanitizeForFirestore({
      attributedReferralCode: business.referralCode,
      attributedReferralBusinessId: business.businessId,
      attributedReferralBusinessName: business.businessName,
      attributedReferralAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }),
    { merge: true }
  )

  return { saved: true, businessId: business.businessId }
}
