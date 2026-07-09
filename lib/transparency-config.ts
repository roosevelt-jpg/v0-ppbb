'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export interface TransparencyGetInvolvedItem {
  title: string
  description: string
}

export interface TransparencyConfig {
  heroHeadline: string
  heroSubheadline: string
  heroTagline: string
  commitmentTitle: string
  commitmentBody: string
  metricsHeading: string
  causesHeading: string
  causesChartTitle: string
  timelineHeading: string
  privacyHeading: string
  privacyBody: string
  privacyBullets: string[]
  contactEmail: string
  ctaHeading: string
  ctaBody: string
  donateLabel: string
  donateHref: string
  joinLabel: string
  joinHref: string
  getInvolvedTitle: string
  getInvolvedItems: TransparencyGetInvolvedItem[]
}

export const DEFAULT_TRANSPARENCY_CONFIG: TransparencyConfig = {
  heroHeadline: 'Transparency & Impact Report',
  heroSubheadline:
    'Know exactly how your donations and support are making a real difference in our community.',
  heroTagline: 'Real-time data • No sensitive donor information shared • Verified impact metrics',
  commitmentTitle: 'Our Commitment',
  commitmentBody:
    'We are dedicated to complete transparency about how donations are used. This dashboard displays real-time impact metrics without exposing sensitive donor information. Every number here represents genuine change in our community.',
  metricsHeading: 'Our Impact at a Glance',
  causesHeading: 'Donations by Cause',
  causesChartTitle: 'Cause Progress',
  timelineHeading: 'Impact Timeline',
  privacyHeading: 'Privacy & Transparency Commitment',
  privacyBody:
    'We are committed to complete transparency about how donations are used. This dashboard displays aggregated impact metrics without exposing any sensitive donor information.',
  privacyBullets: [
    'No individual donor information is displayed',
    'All metrics are aggregated and anonymized',
    'Real-time data updates every 24 hours',
    'Financial statements available upon request',
    'Full compliance with UAE charitable regulations',
  ],
  contactEmail: 'transparency@passiveblessings.ae',
  ctaHeading: 'Help Us Make a Greater Impact',
  ctaBody:
    'Every donation helps us support our community. Together, we can achieve more. Your contribution directly impacts the lives of beneficiaries and strengthens our collective mission.',
  donateLabel: 'Donate Now',
  donateHref: '/dashboard/donations',
  joinLabel: 'Join Our Community',
  joinHref: '/signup',
  getInvolvedTitle: 'Get Involved',
  getInvolvedItems: [
    { title: 'Donate', description: 'Support our causes and help those in need' },
    { title: 'Volunteer', description: 'Contribute your time and skills' },
    { title: 'Partner', description: 'Collaborate with us for greater impact' },
  ],
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim())
  return items.length > 0 ? items : fallback
}

function asGetInvolvedItems(
  value: unknown,
  fallback: TransparencyGetInvolvedItem[]
): TransparencyGetInvolvedItem[] {
  if (!Array.isArray(value)) return fallback
  const items = value
    .map((item) => {
      const row = item as Partial<TransparencyGetInvolvedItem>
      if (typeof row.title !== 'string' || typeof row.description !== 'string') return null
      return { title: row.title, description: row.description }
    })
    .filter((item): item is TransparencyGetInvolvedItem => item !== null)
  return items.length > 0 ? items : fallback
}

export function mergeTransparencyConfig(data: unknown): TransparencyConfig {
  const d = (data || {}) as Partial<TransparencyConfig>
  return {
    heroHeadline: asString(d.heroHeadline, DEFAULT_TRANSPARENCY_CONFIG.heroHeadline),
    heroSubheadline: asString(d.heroSubheadline, DEFAULT_TRANSPARENCY_CONFIG.heroSubheadline),
    heroTagline: asString(d.heroTagline, DEFAULT_TRANSPARENCY_CONFIG.heroTagline),
    commitmentTitle: asString(d.commitmentTitle, DEFAULT_TRANSPARENCY_CONFIG.commitmentTitle),
    commitmentBody: asString(d.commitmentBody, DEFAULT_TRANSPARENCY_CONFIG.commitmentBody),
    metricsHeading: asString(d.metricsHeading, DEFAULT_TRANSPARENCY_CONFIG.metricsHeading),
    causesHeading: asString(d.causesHeading, DEFAULT_TRANSPARENCY_CONFIG.causesHeading),
    causesChartTitle: asString(d.causesChartTitle, DEFAULT_TRANSPARENCY_CONFIG.causesChartTitle),
    timelineHeading: asString(d.timelineHeading, DEFAULT_TRANSPARENCY_CONFIG.timelineHeading),
    privacyHeading: asString(d.privacyHeading, DEFAULT_TRANSPARENCY_CONFIG.privacyHeading),
    privacyBody: asString(d.privacyBody, DEFAULT_TRANSPARENCY_CONFIG.privacyBody),
    privacyBullets: asStringArray(d.privacyBullets, DEFAULT_TRANSPARENCY_CONFIG.privacyBullets),
    contactEmail: asString(d.contactEmail, DEFAULT_TRANSPARENCY_CONFIG.contactEmail),
    ctaHeading: asString(d.ctaHeading, DEFAULT_TRANSPARENCY_CONFIG.ctaHeading),
    ctaBody: asString(d.ctaBody, DEFAULT_TRANSPARENCY_CONFIG.ctaBody),
    donateLabel: asString(d.donateLabel, DEFAULT_TRANSPARENCY_CONFIG.donateLabel),
    donateHref: asString(d.donateHref, DEFAULT_TRANSPARENCY_CONFIG.donateHref),
    joinLabel: asString(d.joinLabel, DEFAULT_TRANSPARENCY_CONFIG.joinLabel),
    joinHref: asString(d.joinHref, DEFAULT_TRANSPARENCY_CONFIG.joinHref),
    getInvolvedTitle: asString(d.getInvolvedTitle, DEFAULT_TRANSPARENCY_CONFIG.getInvolvedTitle),
    getInvolvedItems: asGetInvolvedItems(
      d.getInvolvedItems,
      DEFAULT_TRANSPARENCY_CONFIG.getInvolvedItems
    ),
  }
}

export function subscribeToTransparencyConfig(
  callback: (config: TransparencyConfig) => void
): () => void {
  const docRef = doc(db, 'platformConfig', 'transparency')
  return onSnapshot(
    docRef,
    (snap) => {
      callback(mergeTransparencyConfig(snap.exists() ? snap.data() : null))
    },
    () => {
      callback(DEFAULT_TRANSPARENCY_CONFIG)
    }
  )
}
