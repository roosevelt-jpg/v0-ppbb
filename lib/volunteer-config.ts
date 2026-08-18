'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { mediaUrl } from '@/lib/media-url'

export interface VolunteerPageConfig {
  eyebrow: string
  headline: string
  body: string
  formLink: string
  imageURL: string
  pillarOptions: string[]
  trackingNote: string
}

export interface VolunteerPlatformConfig {
  pageConfig: VolunteerPageConfig
}

export const DEFAULT_VOLUNTEER_PAGE_CONFIG: VolunteerPageConfig = {
  eyebrow: 'APPLICATION',
  headline: 'Apply to volunteer.',
  body: 'While you can join and signup as a member (free or paid), you can also apply to volunteer with the PB Management team and request a role based on your skill and department.',
  formLink: '/forms/volunteer-unpaid-service',
  imageURL: '',
  pillarOptions: [
    'Community Programs',
    'Charity & Welfare',
    'Enterprise & Marketplace',
    'Spiritual & Personal Growth',
    'Partnerships',
    'Media & Content',
    'Admin & Finance',
  ],
  trackingNote:
    'Volunteer hours are tracked every time you attend a Thursday charity event.',
}

export const DEFAULT_VOLUNTEER_CONFIG: VolunteerPlatformConfig = {
  pageConfig: DEFAULT_VOLUNTEER_PAGE_CONFIG,
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

export function mergeVolunteerPageConfig(data: unknown): VolunteerPageConfig {
  const d = (data || {}) as Partial<VolunteerPageConfig>
  const defaults = DEFAULT_VOLUNTEER_PAGE_CONFIG
  const pillars = Array.isArray(d.pillarOptions)
    ? d.pillarOptions.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    : defaults.pillarOptions
  return {
    eyebrow: asString(d.eyebrow, defaults.eyebrow),
    headline: asString(d.headline, defaults.headline),
    body: asString(d.body, defaults.body),
    formLink: asString(d.formLink, defaults.formLink),
    imageURL: mediaUrl(asString(d.imageURL, defaults.imageURL)),
    pillarOptions: pillars.length > 0 ? pillars : defaults.pillarOptions,
    trackingNote: asString(d.trackingNote, defaults.trackingNote),
  }
}

export function mergeVolunteerConfig(data: unknown): VolunteerPlatformConfig {
  const raw = (data || {}) as { pageConfig?: unknown }
  return {
    pageConfig: mergeVolunteerPageConfig(raw.pageConfig ?? data),
  }
}

export function subscribeToVolunteerConfig(
  callback: (config: VolunteerPlatformConfig) => void
): () => void {
  const docRef = doc(db, 'platformConfig', 'volunteer')
  return onSnapshot(
    docRef,
    (snap) => {
      callback(snap.exists() ? mergeVolunteerConfig(snap.data()) : DEFAULT_VOLUNTEER_CONFIG)
    },
    () => callback(DEFAULT_VOLUNTEER_CONFIG)
  )
}
