'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export interface MarketplaceBenefit {
  title: string
  description: string
}

export interface MarketplacePageConfig {
  eyebrow: string
  headline: string
  body: string
  /** WhatsApp channel/group URL — admin-managed; falls back to Global Settings if empty */
  whatsappLink: string
  whatsappButtonLabel: string
  membershipEyebrow: string
  membershipHeadline: string
  membershipBody: string
  membershipCTA: string
  membershipCTAHref: string
  benefitsEyebrow: string
  benefitsHeadline: string
  benefits: MarketplaceBenefit[]
  membershipImageURL: string
  /** Image beside the first marketplace hero text block */
  heroImageURL: string
}

export interface MarketplacePlatformConfig {
  pageConfig: MarketplacePageConfig
}

export const DEFAULT_MARKETPLACE_PAGE_CONFIG: MarketplacePageConfig = {
  eyebrow: 'ENTERPRISE & MARKETPLACE',
  headline: 'Where halal business and community meet.',
  body: 'Our marketplace and directory exist to help member-owned businesses find customers, mentors and opportunity inside their own community.',
  whatsappLink: '',
  whatsappButtonLabel: 'Join Our Whatsapp',
  membershipEyebrow: 'MEMBERSHIP',
  membershipHeadline: 'AED 300 / month.',
  membershipBody:
    'Our membership unlocks the full enterprise pillar — directory listing, booth priority, networking events, discounts and direct support from our team.',
  membershipCTA: 'Become a member',
  membershipCTAHref: '/dashboard/membership?upgrade=business',
  benefitsEyebrow: 'BENEFITS',
  benefitsHeadline: 'Built for builders.',
  benefits: [
    {
      title: 'Discounts',
      description: 'Member-only pricing across the directory of community-owned businesses.',
    },
    {
      title: 'Exposure',
      description: 'Featured placement, social spotlights and event booth opportunities.',
    },
    {
      title: 'Networking',
      description: 'Monthly business circles, mentorship and curated introductions.',
    },
  ],
  membershipImageURL: '',
  heroImageURL: '',
}

export const DEFAULT_MARKETPLACE_CONFIG: MarketplacePlatformConfig = {
  pageConfig: DEFAULT_MARKETPLACE_PAGE_CONFIG,
}

function mergeBenefits(data: unknown): MarketplaceBenefit[] {
  if (!Array.isArray(data)) return DEFAULT_MARKETPLACE_PAGE_CONFIG.benefits
  const merged = data
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const b = item as Partial<MarketplaceBenefit>
      return {
        title: typeof b.title === 'string' ? b.title : '',
        description: typeof b.description === 'string' ? b.description : '',
      }
    })
    .filter((b) => b.title.trim().length > 0 || b.description.trim().length > 0)
  return merged.length > 0 ? merged : DEFAULT_MARKETPLACE_PAGE_CONFIG.benefits
}

function mergePageConfig(data: unknown): MarketplacePageConfig {
  const d = (data || {}) as Partial<MarketplacePageConfig>
  const defaults = DEFAULT_MARKETPLACE_PAGE_CONFIG
  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : defaults.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : defaults.headline,
    body: typeof d.body === 'string' ? d.body : defaults.body,
    whatsappLink: typeof d.whatsappLink === 'string' ? d.whatsappLink : defaults.whatsappLink,
    whatsappButtonLabel:
      typeof d.whatsappButtonLabel === 'string' && d.whatsappButtonLabel.trim()
        ? d.whatsappButtonLabel
        : defaults.whatsappButtonLabel,
    membershipEyebrow:
      typeof d.membershipEyebrow === 'string' ? d.membershipEyebrow : defaults.membershipEyebrow,
    membershipHeadline:
      typeof d.membershipHeadline === 'string'
        ? d.membershipHeadline
        : defaults.membershipHeadline,
    membershipBody:
      typeof d.membershipBody === 'string' ? d.membershipBody : defaults.membershipBody,
    membershipCTA: typeof d.membershipCTA === 'string' ? d.membershipCTA : defaults.membershipCTA,
    membershipCTAHref:
      typeof d.membershipCTAHref === 'string' ? d.membershipCTAHref : defaults.membershipCTAHref,
    benefitsEyebrow:
      typeof d.benefitsEyebrow === 'string' ? d.benefitsEyebrow : defaults.benefitsEyebrow,
    benefitsHeadline:
      typeof d.benefitsHeadline === 'string' ? d.benefitsHeadline : defaults.benefitsHeadline,
    benefits: mergeBenefits(d.benefits),
    membershipImageURL:
      typeof d.membershipImageURL === 'string' ? d.membershipImageURL : defaults.membershipImageURL,
    heroImageURL: typeof d.heroImageURL === 'string' ? d.heroImageURL : defaults.heroImageURL,
  }
}

export function mergeMarketplaceConfig(
  data: Record<string, unknown> | undefined
): MarketplacePlatformConfig {
  if (!data) return DEFAULT_MARKETPLACE_CONFIG
  return {
    pageConfig: mergePageConfig(data.pageConfig),
  }
}

async function fetchMarketplaceConfigFromApi(): Promise<Record<string, unknown> | undefined> {
  try {
    const res = await fetch('/api/platform-config/marketplace', { cache: 'no-store' })
    const json = await res.json()
    if (json.success && json.data) return json.data as Record<string, unknown>
  } catch (error) {
    console.error('[marketplace-config] API config fetch failed:', error)
  }
  return undefined
}

export function subscribeToMarketplaceConfig(
  callback: (config: MarketplacePlatformConfig) => void
): () => void {
  let cancelled = false

  const apply = (data: Record<string, unknown> | undefined) => {
    if (!cancelled) callback(mergeMarketplaceConfig(data))
  }

  const loadFallback = async () => {
    const data = await fetchMarketplaceConfigFromApi()
    if (data) apply(data)
    else if (!cancelled) callback(DEFAULT_MARKETPLACE_CONFIG)
  }

  try {
    const docRef = doc(db, 'platformConfig', 'marketplace')
    const unsub = onSnapshot(
      docRef,
      (snapshot) => apply(snapshot.exists() ? snapshot.data() : undefined),
      (error) => {
        console.error('[marketplace-config] Firestore listener failed:', error)
        void loadFallback()
      }
    )
    return () => {
      cancelled = true
      unsub()
    }
  } catch (error) {
    console.error('[marketplace-config] subscribe failed:', error)
    void loadFallback()
    return () => {
      cancelled = true
    }
  }
}
