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
  metricDonationsLabel: string
  metricDonationsSubtext: string
  metricBeneficiariesLabel: string
  metricBeneficiariesSubtext: string
  metricCausesLabel: string
  metricCausesSubtext: string
  metricVolunteerLabel: string
  metricVolunteerSubtext: string
  causesHeading: string
  causesChartTitle: string
  totalFundraisedLabel: string
  causesFundedLabel: string
  causesFundedSubtext: string
  timelineHeading: string
  timelineThisMonthLabel: string
  timelineThisQuarterLabel: string
  timelineYtdLabel: string
  privacyHeading: string
  privacyBody: string
  privacyBullets: string[]
  contactPrompt: string
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
  metricDonationsLabel: 'Total Donations',
  metricDonationsSubtext: 'donations',
  metricBeneficiariesLabel: 'Beneficiaries Helped',
  metricBeneficiariesSubtext: 'Lives impacted',
  metricCausesLabel: 'Active Causes',
  metricCausesSubtext: 'Ongoing initiatives',
  metricVolunteerLabel: 'Volunteer Hours',
  metricVolunteerSubtext: 'volunteers',
  causesHeading: 'Donations by Cause',
  causesChartTitle: 'Cause Progress',
  totalFundraisedLabel: 'Total Fundraised',
  causesFundedLabel: 'Causes Funded',
  causesFundedSubtext: 'Fully funded',
  timelineHeading: 'Impact Timeline',
  timelineThisMonthLabel: 'This Month',
  timelineThisQuarterLabel: 'This Quarter',
  timelineYtdLabel: 'Year-to-Date',
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
  contactPrompt: 'Questions about our transparency? Contact our team at',
  contactEmail: 'transparency@passive-blessings.com',
  ctaHeading: 'Help Us Make a Greater Impact',
  ctaBody:
    'Every donation helps us support our community. Together, we can achieve more. Your contribution directly impacts the lives of beneficiaries and strengthens our collective mission.',
  donateLabel: 'Donate Now',
  donateHref: '/dashboard/donations',
  joinLabel: 'Join Our Community',
  joinHref: '/join',
  getInvolvedTitle: 'Get Involved',
  getInvolvedItems: [
    { title: 'Donate', description: 'Support our causes and help those in need' },
    { title: 'Volunteer', description: 'Contribute your time and skills' },
    { title: 'Partner', description: 'Collaborate with us for greater impact' },
  ],
}

const WRONG_EMAIL_HOSTS = ['passiveblessings.ae', 'passiveblessing.ae', 'passiveblessings.com']

function normalizeContactEmail(email: string): string {
  const trimmed = email.trim()
  if (!trimmed) return DEFAULT_TRANSPARENCY_CONFIG.contactEmail
  const lower = trimmed.toLowerCase()
  if (WRONG_EMAIL_HOSTS.some((host) => lower.endsWith(`@${host}`))) {
    const local = trimmed.split('@')[0] || 'transparency'
    return `${local}@passive-blessings.com`
  }
  return trimmed
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
    metricDonationsLabel: asString(
      d.metricDonationsLabel,
      DEFAULT_TRANSPARENCY_CONFIG.metricDonationsLabel
    ),
    metricDonationsSubtext: asString(
      d.metricDonationsSubtext,
      DEFAULT_TRANSPARENCY_CONFIG.metricDonationsSubtext
    ),
    metricBeneficiariesLabel: asString(
      d.metricBeneficiariesLabel,
      DEFAULT_TRANSPARENCY_CONFIG.metricBeneficiariesLabel
    ),
    metricBeneficiariesSubtext: asString(
      d.metricBeneficiariesSubtext,
      DEFAULT_TRANSPARENCY_CONFIG.metricBeneficiariesSubtext
    ),
    metricCausesLabel: asString(d.metricCausesLabel, DEFAULT_TRANSPARENCY_CONFIG.metricCausesLabel),
    metricCausesSubtext: asString(
      d.metricCausesSubtext,
      DEFAULT_TRANSPARENCY_CONFIG.metricCausesSubtext
    ),
    metricVolunteerLabel: asString(
      d.metricVolunteerLabel,
      DEFAULT_TRANSPARENCY_CONFIG.metricVolunteerLabel
    ),
    metricVolunteerSubtext: asString(
      d.metricVolunteerSubtext,
      DEFAULT_TRANSPARENCY_CONFIG.metricVolunteerSubtext
    ),
    causesHeading: asString(d.causesHeading, DEFAULT_TRANSPARENCY_CONFIG.causesHeading),
    causesChartTitle: asString(d.causesChartTitle, DEFAULT_TRANSPARENCY_CONFIG.causesChartTitle),
    totalFundraisedLabel: asString(
      d.totalFundraisedLabel,
      DEFAULT_TRANSPARENCY_CONFIG.totalFundraisedLabel
    ),
    causesFundedLabel: asString(d.causesFundedLabel, DEFAULT_TRANSPARENCY_CONFIG.causesFundedLabel),
    causesFundedSubtext: asString(
      d.causesFundedSubtext,
      DEFAULT_TRANSPARENCY_CONFIG.causesFundedSubtext
    ),
    timelineHeading: asString(d.timelineHeading, DEFAULT_TRANSPARENCY_CONFIG.timelineHeading),
    timelineThisMonthLabel: asString(
      d.timelineThisMonthLabel,
      DEFAULT_TRANSPARENCY_CONFIG.timelineThisMonthLabel
    ),
    timelineThisQuarterLabel: asString(
      d.timelineThisQuarterLabel,
      DEFAULT_TRANSPARENCY_CONFIG.timelineThisQuarterLabel
    ),
    timelineYtdLabel: asString(d.timelineYtdLabel, DEFAULT_TRANSPARENCY_CONFIG.timelineYtdLabel),
    privacyHeading: asString(d.privacyHeading, DEFAULT_TRANSPARENCY_CONFIG.privacyHeading),
    privacyBody: asString(d.privacyBody, DEFAULT_TRANSPARENCY_CONFIG.privacyBody),
    privacyBullets: asStringArray(d.privacyBullets, DEFAULT_TRANSPARENCY_CONFIG.privacyBullets),
    contactPrompt: asString(d.contactPrompt, DEFAULT_TRANSPARENCY_CONFIG.contactPrompt),
    contactEmail: normalizeContactEmail(
      asString(d.contactEmail, DEFAULT_TRANSPARENCY_CONFIG.contactEmail)
    ),
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
