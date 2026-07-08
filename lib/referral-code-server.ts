import type { Firestore } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import {
  DEFAULT_REFERRALS_CONFIG,
  mergeReferralsConfig,
  type ReferralsPlatformConfig,
} from '@/lib/referral-config'

export function slugifyBusinessName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12)
  return slug || 'biz'
}

function randomSuffix(length = 4): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export async function getReferralsPlatformConfig(
  db: Firestore
): Promise<ReferralsPlatformConfig> {
  const snap = await db.collection('platformConfig').doc('referrals').get()
  if (!snap.exists) {
    await db.collection('platformConfig').doc('referrals').set(
      sanitizeForFirestore({
        ...DEFAULT_REFERRALS_CONFIG,
        updatedAt: new Date(),
      }),
      { merge: true }
    )
    return DEFAULT_REFERRALS_CONFIG
  }
  return mergeReferralsConfig(snap.data())
}

/**
 * Generates a unique businesses.referralCode (slug + suffix).
 * Returns existing code if already set.
 */
export async function ensureBusinessReferralCode(
  db: Firestore,
  businessId: string,
  businessName: string,
  existingCode?: string | null
): Promise<{ referralCode: string; referralContributionPercent: number; created: boolean }> {
  if (existingCode && String(existingCode).trim()) {
    const existing = await db.collection('businesses').doc(businessId).get()
    const percent =
      typeof existing.data()?.referralContributionPercent === 'number'
        ? (existing.data()?.referralContributionPercent as number)
        : (await getReferralsPlatformConfig(db)).defaultContributionPercent
    return {
      referralCode: String(existingCode).trim(),
      referralContributionPercent: percent,
      created: false,
    }
  }

  const config = await getReferralsPlatformConfig(db)
  const base = slugifyBusinessName(businessName)

  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = `${base}${randomSuffix(4)}`
    const clash = await db
      .collection('businesses')
      .where('referralCode', '==', candidate)
      .limit(1)
      .get()
    if (!clash.empty) continue

    await db.collection('businesses').doc(businessId).set(
      sanitizeForFirestore({
        referralCode: candidate,
        referralContributionPercent: config.defaultContributionPercent,
        referralCodeCreatedAt: new Date(),
      }),
      { merge: true }
    )

    return {
      referralCode: candidate,
      referralContributionPercent: config.defaultContributionPercent,
      created: true,
    }
  }

  // Extremely unlikely fallback — include businessId slice
  const fallback = `${base}${businessId.slice(0, 6).toLowerCase()}`
  await db.collection('businesses').doc(businessId).set(
    sanitizeForFirestore({
      referralCode: fallback,
      referralContributionPercent: config.defaultContributionPercent,
      referralCodeCreatedAt: new Date(),
    }),
    { merge: true }
  )
  return {
    referralCode: fallback,
    referralContributionPercent: config.defaultContributionPercent,
    created: true,
  }
}
