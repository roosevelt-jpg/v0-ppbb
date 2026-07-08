'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export interface DonationsPlatformConfig {
  beitAlKhairURL: string
  legalPartnershipTitle: string
  legalPartnershipBody: string
  pageEyebrow: string
  pageHeadline: string
  pageBody: string
}

export const DEFAULT_DONATIONS_CONFIG: DonationsPlatformConfig = {
  beitAlKhairURL: '',
  legalPartnershipTitle: 'In partnership with approved charitable entities',
  legalPartnershipBody:
    'Passive Blessings acts as a community mobilizer and awareness partner. Funds are collected through official charitable partners including Beit Al Khair, ensuring transparency and direct impact.',
  pageEyebrow: 'GIVE WITH PURPOSE',
  pageHeadline: 'Make a Difference',
  pageBody:
    'Passive Blessings acts as a community mobilizer and awareness partner. Funds are collected through official charitable partners including Beit Al Khair, ensuring transparency and direct impact.',
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

export function mergeDonationsConfig(data: unknown): DonationsPlatformConfig {
  const d = (data || {}) as Partial<DonationsPlatformConfig>
  return {
    beitAlKhairURL: asString(d.beitAlKhairURL, DEFAULT_DONATIONS_CONFIG.beitAlKhairURL),
    legalPartnershipTitle: asString(
      d.legalPartnershipTitle,
      DEFAULT_DONATIONS_CONFIG.legalPartnershipTitle
    ),
    legalPartnershipBody: asString(
      d.legalPartnershipBody,
      DEFAULT_DONATIONS_CONFIG.legalPartnershipBody
    ),
    pageEyebrow: asString(d.pageEyebrow, DEFAULT_DONATIONS_CONFIG.pageEyebrow),
    pageHeadline: asString(d.pageHeadline, DEFAULT_DONATIONS_CONFIG.pageHeadline),
    pageBody: asString(d.pageBody, DEFAULT_DONATIONS_CONFIG.pageBody),
  }
}

export function subscribeToDonationsConfig(
  callback: (config: DonationsPlatformConfig) => void
): () => void {
  const docRef = doc(db, 'platformConfig', 'donations')
  return onSnapshot(
    docRef,
    (snap) => {
      callback(mergeDonationsConfig(snap.exists() ? snap.data() : null))
    },
    () => {
      callback(DEFAULT_DONATIONS_CONFIG)
    }
  )
}
