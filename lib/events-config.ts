'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export interface EventsPageConfig {
  eyebrow: string
  headline: string
  body: string
  whatsappButtonLabel: string
  whatsappLink: string
  lineupHeadingTemplate: string
  lineupCountTemplate: string
  emptyLineupMessage: string
  registerButtonLabel: string
  detailsButtonLabel: string
  /** Volunteer promo banner on /events */
  volunteerBannerImageURL?: string
  volunteerBannerHref?: string
  volunteerBannerAlt?: string
  /** Horizontal advertising banner (admin-uploaded image/gif) */
  adBannerImageURL?: string
  adBannerHref?: string
  adBannerAlt?: string
}

export interface EventsCategory {
  id: string
  name: string
  color: string
}

/** Public /events filter tab — driven by CMS categories (+ ALL). */
export interface EventsFilterTab {
  id: string
  label: string
}

export interface EventsPlatformConfig {
  pageConfig: EventsPageConfig
  categories: EventsCategory[]
  filterTabs: EventsFilterTab[]
  pbCommissionPercent: number
}

export const DEFAULT_EVENTS_CONFIG: EventsPlatformConfig = {
  pageConfig: {
    eyebrow: 'COMMUNITY EVENTS & WORKSHOPS',
    headline: 'Where the community comes alive.',
    body: 'Every week, we gather. Charity days, sisters circles, brothers nights, family days and mixed events — there is always a space for you.',
    whatsappButtonLabel: 'Join our WhatsApp Channel',
    whatsappLink: '',
    lineupHeadingTemplate: '{MONTH} LINEUP',
    lineupCountTemplate: '{count} events this month',
    emptyLineupMessage:
      'No events scheduled this month. Check back soon or join our WhatsApp channel for updates.',
    registerButtonLabel: 'Register',
    detailsButtonLabel: 'Details',
    volunteerBannerImageURL: '',
    volunteerBannerHref: '/forms/volunteer-with-pb',
    volunteerBannerAlt: 'Volunteer with Passive Blessings',
    adBannerImageURL: '',
    adBannerHref: '',
    adBannerAlt: 'Advertisement',
  },
  categories: [
    { id: 'tech', name: 'Tech', color: '#0EA5E9' },
    { id: 'education', name: 'Education', color: '#7C3AED' },
    { id: 'social', name: 'Social', color: '#DB2777' },
    { id: 'business', name: 'Business', color: '#0F766E' },
    { id: 'games', name: 'Games', color: '#EA580C' },
    { id: 'charity', name: 'Charity', color: '#BE123C' },
    { id: 'sisters', name: 'Sisters', color: '#DB2777' },
    { id: 'brothers', name: 'Brothers', color: '#4F46E5' },
    { id: 'family', name: 'Family', color: '#059669' },
    { id: 'mixed', name: 'Mixed', color: '#2563EB' },
    { id: 'workshop', name: 'Workshop', color: '#D97706' },
  ],
  filterTabs: [],
  pbCommissionPercent: 10,
}

export function slugifyCategoryId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Build public filter tabs from CMS categories (always includes ALL). */
export function buildCategoryFilterTabs(categories: EventsCategory[]): EventsFilterTab[] {
  return [
    { id: 'all', label: 'ALL' },
    ...categories
      .filter((c) => c.id.trim() && c.name.trim())
      .map((c) => ({
        id: c.id.trim(),
        label: c.name.trim().toUpperCase(),
      })),
  ]
}

function mergePageConfig(data: unknown): EventsPageConfig {
  const d = (data || {}) as Partial<EventsPageConfig>
  const defaults = DEFAULT_EVENTS_CONFIG.pageConfig
  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : defaults.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : defaults.headline,
    body: typeof d.body === 'string' ? d.body : defaults.body,
    whatsappButtonLabel:
      typeof d.whatsappButtonLabel === 'string' ? d.whatsappButtonLabel : defaults.whatsappButtonLabel,
    whatsappLink: typeof d.whatsappLink === 'string' ? d.whatsappLink : defaults.whatsappLink,
    lineupHeadingTemplate:
      typeof d.lineupHeadingTemplate === 'string'
        ? d.lineupHeadingTemplate
        : defaults.lineupHeadingTemplate,
    lineupCountTemplate:
      typeof d.lineupCountTemplate === 'string'
        ? d.lineupCountTemplate
        : defaults.lineupCountTemplate,
    emptyLineupMessage:
      typeof d.emptyLineupMessage === 'string' ? d.emptyLineupMessage : defaults.emptyLineupMessage,
    registerButtonLabel:
      typeof d.registerButtonLabel === 'string'
        ? d.registerButtonLabel
        : defaults.registerButtonLabel,
    detailsButtonLabel:
      typeof d.detailsButtonLabel === 'string'
        ? d.detailsButtonLabel
        : defaults.detailsButtonLabel,
    volunteerBannerImageURL:
      typeof d.volunteerBannerImageURL === 'string'
        ? d.volunteerBannerImageURL
        : defaults.volunteerBannerImageURL,
    volunteerBannerHref:
      typeof d.volunteerBannerHref === 'string'
        ? d.volunteerBannerHref
        : defaults.volunteerBannerHref,
    volunteerBannerAlt:
      typeof d.volunteerBannerAlt === 'string' ? d.volunteerBannerAlt : defaults.volunteerBannerAlt,
    adBannerImageURL:
      typeof d.adBannerImageURL === 'string' ? d.adBannerImageURL : defaults.adBannerImageURL,
    adBannerHref: typeof d.adBannerHref === 'string' ? d.adBannerHref : defaults.adBannerHref,
    adBannerAlt: typeof d.adBannerAlt === 'string' ? d.adBannerAlt : defaults.adBannerAlt,
  }
}

const LEGACY_CATEGORY_IDS = new Set([
  'charity',
  'sisters',
  'brothers',
  'family',
  'mixed',
  'workshop',
])

function mergeCategories(data: unknown): EventsCategory[] {
  if (!Array.isArray(data)) return DEFAULT_EVENTS_CONFIG.categories
  const merged = data
    .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
    .map((item, i) => ({
      id: item.id.trim() || slugifyCategoryId(item.name) || `category-${i + 1}`,
      name: item.name.trim() || 'Category',
      color:
        typeof item.color === 'string' && item.color.trim()
          ? item.color
          : DEFAULT_EVENTS_CONFIG.categories[i]?.color || '#111111',
    }))
  if (merged.length === 0) return DEFAULT_EVENTS_CONFIG.categories

  // Upgrade legacy audience-only category lists to the expanded topic set once
  const ids = new Set(merged.map((c) => c.id.toLowerCase()))
  const isLegacyOnly =
    merged.length <= 6 && [...ids].every((id) => LEGACY_CATEGORY_IDS.has(id))
  if (isLegacyOnly) {
    const byId = new Map(merged.map((c) => [c.id.toLowerCase(), c]))
    return DEFAULT_EVENTS_CONFIG.categories.map((def) => byId.get(def.id) || def)
  }

  return merged
}

function mergeEventsConfig(data: Record<string, unknown> | undefined): EventsPlatformConfig {
  if (!data) {
    return {
      ...DEFAULT_EVENTS_CONFIG,
      filterTabs: buildCategoryFilterTabs(DEFAULT_EVENTS_CONFIG.categories),
    }
  }
  const categories = mergeCategories(data.categories)
  return {
    pageConfig: mergePageConfig(data.pageConfig),
    categories,
    filterTabs: buildCategoryFilterTabs(categories),
    pbCommissionPercent:
      typeof data.pbCommissionPercent === 'number'
        ? data.pbCommissionPercent
        : DEFAULT_EVENTS_CONFIG.pbCommissionPercent,
  }
}

async function fetchEventsConfigFromApi(): Promise<Record<string, unknown> | undefined> {
  try {
    const res = await fetch('/api/platform-config/events', { cache: 'no-store' })
    const json = await res.json()
    if (json.success && json.data) return json.data as Record<string, unknown>
  } catch (error) {
    console.error('[events-config] API fetch failed:', error)
  }
  return undefined
}

export function subscribeToEventsConfig(
  callback: (config: EventsPlatformConfig) => void
): () => void {
  let cancelled = false

  const apply = (data: Record<string, unknown> | undefined) => {
    if (!cancelled) callback(mergeEventsConfig(data))
  }

  const loadFallback = async () => {
    const data = await fetchEventsConfigFromApi()
    if (data) apply(data)
    else if (!cancelled) {
      callback({
        ...DEFAULT_EVENTS_CONFIG,
        filterTabs: buildCategoryFilterTabs(DEFAULT_EVENTS_CONFIG.categories),
      })
    }
  }

  try {
    const docRef = doc(db, 'platformConfig', 'events')
    const unsub = onSnapshot(
      docRef,
      (snapshot) => apply(snapshot.exists() ? snapshot.data() : undefined),
      (error) => {
        console.error('[events-config] Firestore listener failed:', error)
        void loadFallback()
      }
    )
    return () => {
      cancelled = true
      unsub()
    }
  } catch (error) {
    console.error('[events-config] subscribe failed:', error)
    void loadFallback()
    return () => {
      cancelled = true
    }
  }
}

export function getCategoryColor(categories: EventsCategory[], categoryId: string): string {
  const match = categories.find((c) => c.id.toLowerCase() === categoryId.toLowerCase())
  return match?.color || '#111111'
}

export function getCategoryName(categories: EventsCategory[], categoryId: string): string {
  const match = categories.find((c) => c.id.toLowerCase() === categoryId.toLowerCase())
  return match?.name || categoryId
}

export function formatLineupHeading(template: string, monthLabel: string): string {
  return template.replace('{MONTH}', monthLabel.toUpperCase())
}

export function formatLineupCount(template: string, count: number): string {
  return template.replace('{count}', String(count))
}
