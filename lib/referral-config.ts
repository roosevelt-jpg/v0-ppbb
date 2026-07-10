'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export type ReferralsPlatformConfig = {
  defaultContributionPercent: number
  attributionWindowDays: number
}

export const DEFAULT_REFERRALS_CONFIG: ReferralsPlatformConfig = {
  defaultContributionPercent: 10,
  attributionWindowDays: 30,
}

export const REFERRAL_COOKIE_NAME = 'pb_referral_code'

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function mergeReferralsConfig(data: unknown): ReferralsPlatformConfig {
  const d = (data || {}) as Partial<ReferralsPlatformConfig>
  const defaults = DEFAULT_REFERRALS_CONFIG
  return {
    defaultContributionPercent: asNumber(
      d.defaultContributionPercent,
      defaults.defaultContributionPercent
    ),
    attributionWindowDays: asNumber(d.attributionWindowDays, defaults.attributionWindowDays),
  }
}

export function subscribeToReferralsConfig(
  callback: (config: ReferralsPlatformConfig) => void
): () => void {
  return onSnapshot(
    doc(db, 'platformConfig', 'referrals'),
    (snap) => {
      callback(snap.exists() ? mergeReferralsConfig(snap.data()) : DEFAULT_REFERRALS_CONFIG)
    },
    () => callback(DEFAULT_REFERRALS_CONFIG)
  )
}

/** Referral conversion document written to referrals/ on paid actions. */
export type ReferralConversionDoc = {
  businessId: string
  referralCode: string
  conversionType: 'membership' | 'purchase' | 'event'
  convertedUserId: string
  relatedDocId: string
  revenueAmount: number
  contributionPercent: number
  contributionAmount: number
  status: 'pending' | 'confirmed' | 'paid'
  createdAt: unknown
}
