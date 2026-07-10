'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import type { EventsAudienceFilter } from '@/lib/event-utils'

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
}

export interface EventsCategory {
  id: string
  name: string
  color: string
}

export interface EventsFilterTab {
  id: EventsAudienceFilter
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
    emptyLineupMessage: 'No events scheduled this month. Check back soon or join our WhatsApp channel for updates.',
    registerButtonLabel: 'Register',
    detailsButtonLabel: 'Details',
  },
  categories: [
    { id: 'charity', name: 'Charity Day', color: '#BE123C' },
    { id: 'sisters', name: 'Sisters Circle', color: '#DB2777' },
    { id: 'brothers', name: 'Brothers Night', color: '#4F46E5' },
    { id: 'family', name: 'Family Day', color: '#059669' },
    { id: 'mixed', name: 'Community', color: '#2563EB' },
    { id: 'workshop', name: 'Workshop', color: '#D97706' },
  ],
  filterTabs: [
    { id: 'all', label: 'ALL' },
    { id: 'sisters', label: 'SISTERS' },
    { id: 'brothers', label: 'BROTHERS' },
    { id: 'mixed', label: 'MIXED' },
    { id: 'family', label: 'FAMILY' },
  ],
  pbCommissionPercent: 10,
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
      typeof d.registerButtonLabel === 'string' ? d.registerButtonLabel : defaults.registerButtonLabel,
    detailsButtonLabel:
      typeof d.detailsButtonLabel === 'string' ? d.detailsButtonLabel : defaults.detailsButtonLabel,
  }
}

function mergeCategories(data: unknown): EventsCategory[] {
  if (!Array.isArray(data)) return DEFAULT_EVENTS_CONFIG.categories
  const merged = data
    .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
    .map((item, i) => ({
      id: item.id,
      name: item.name,
      color:
        typeof item.color === 'string'
          ? item.color
          : DEFAULT_EVENTS_CONFIG.categories[i]?.color || '#111111',
    }))
  return merged.length > 0 ? merged : DEFAULT_EVENTS_CONFIG.categories
}

function mergeFilterTabs(data: unknown): EventsFilterTab[] {
  if (!Array.isArray(data)) return DEFAULT_EVENTS_CONFIG.filterTabs
  const validIds = new Set(['all', 'sisters', 'brothers', 'mixed', 'family'])
  const merged = data
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        validIds.has(item.id) &&
        typeof item.label === 'string'
    )
    .map((item) => ({
      id: item.id as EventsAudienceFilter,
      label: item.label,
    }))
  return merged.length > 0 ? merged : DEFAULT_EVENTS_CONFIG.filterTabs
}

function mergeEventsConfig(data: Record<string, unknown> | undefined): EventsPlatformConfig {
  if (!data) return DEFAULT_EVENTS_CONFIG
  return {
    pageConfig: mergePageConfig(data.pageConfig),
    categories: mergeCategories(data.categories),
    filterTabs: mergeFilterTabs(data.filterTabs),
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
    else if (!cancelled) callback(DEFAULT_EVENTS_CONFIG)
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

export function getCategoryColor(
  categories: EventsCategory[],
  categoryId: string
): string {
  const match = categories.find(
    (c) => c.id.toLowerCase() === categoryId.toLowerCase()
  )
  return match?.color || '#111111'
}

export function getCategoryName(
  categories: EventsCategory[],
  categoryId: string
): string {
  const match = categories.find(
    (c) => c.id.toLowerCase() === categoryId.toLowerCase()
  )
  return match?.name || categoryId
}

export function formatLineupHeading(template: string, monthLabel: string): string {
  return template.replace('{MONTH}', monthLabel.toUpperCase())
}

export function formatLineupCount(template: string, count: number): string {
  return template.replace('{count}', String(count))
}
