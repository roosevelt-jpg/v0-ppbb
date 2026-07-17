'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export interface PartnersTrack {
  title: string
  description: string
}

export interface PartnersInquiryCategory {
  id: string
  label: string
  /** Linked custom form id from Admin → Forms */
  formId: string
  /** Public slug — used for /forms/{slug} */
  formSlug: string
  /** Optional external URL override (used if set; otherwise formSlug) */
  formUrl: string
}

export interface PartnersFeaturedProject {
  id: string
  title: string
  brief: string
  date: string
  location: string
  partnerNames: string
  imageURL: string
  ctaLabel: string
  ctaHref: string
}

export interface PartnersPageConfig {
  eyebrow: string
  headline: string
  body: string
  sponsorshipDeckEyebrow: string
  sponsorshipDeckHeadline: string
  sponsorshipDeckBody: string
  sponsorshipDeckCTA: string
  sponsorshipDeckPDFUrl: string
  tracksEyebrow: string
  tracksHeadline: string
  tracks: PartnersTrack[]
  inquiryEyebrow: string
  inquiryHeadline: string
  inquiryBody: string
  inquiryCTA: string
  inquiryCategories: PartnersInquiryCategory[]
  trustedByLabel: string
  trustedBySubLabel: string
  trustedByDescription: string
  featuredProjects: PartnersFeaturedProject[]
  /** Image used beside “Partner with Passive Blessings” on the homepage */
  homepageCtaImageURL: string
}

export interface PartnersPlatformConfig {
  pageConfig: PartnersPageConfig
}

export const DEFAULT_PARTNERS_PAGE_CONFIG: PartnersPageConfig = {
  eyebrow: 'PILLAR 05 — PARTNERSHIPS & COLLABORATIONS',
  headline: 'Build alongside us.',
  body: 'From governmental programmes to corporate sponsorships to grassroots collaborations — every partnership multiplies what we can do.',
  sponsorshipDeckEyebrow: 'SPONSORSHIP DECK',
  sponsorshipDeckHeadline: 'For brands ready to do more.',
  sponsorshipDeckBody:
    'Our sponsorship deck details every tier — from event sponsorships to year-long ecosystem partnerships. Download to share with your team.',
  sponsorshipDeckCTA: 'Request the deck',
  sponsorshipDeckPDFUrl: '',
  tracksEyebrow: 'THREE TRACKS',
  tracksHeadline: 'How we work together.',
  tracks: [
    {
      title: 'Government',
      description:
        'Aligned programmes with public sector bodies, civic initiatives and humanitarian channels.',
    },
    {
      title: 'Corporate',
      description:
        'CSR, employee volunteering, event sponsorship and brand-aligned partnerships.',
    },
    {
      title: 'Grassroots',
      description:
        'Community-to-community collaborations with mosques, schools and local non-profits.',
    },
  ],
  inquiryEyebrow: 'INQUIRY',
  inquiryHeadline: 'Tell us what you have in mind.',
  inquiryBody: 'Brief us on your vision and our partnerships team will respond within 48 hours.',
  inquiryCTA: 'Start a conversation',
  inquiryCategories: [
    {
      id: 'partnerships',
      label: 'Partnerships',
      formId: '',
      formSlug: '',
      formUrl: '',
    },
    {
      id: 'sponsorship',
      label: 'Sponsorship',
      formId: '',
      formSlug: '',
      formUrl: '',
    },
    {
      id: 'charity-support',
      label: 'Seeking Charity Support',
      formId: '',
      formSlug: '',
      formUrl: '',
    },
  ],
  trustedByLabel: 'TRUSTED BY',
  trustedBySubLabel: 'Previous sponsors & partners.',
  trustedByDescription:
    'A selection of organisations that have supported, sponsored or collaborated with Passive Blessings.',
  featuredProjects: [],
  homepageCtaImageURL: '',
}

export const DEFAULT_PARTNERS_CONFIG: PartnersPlatformConfig = {
  pageConfig: DEFAULT_PARTNERS_PAGE_CONFIG,
}

export function getInquiryCategoryHref(category: PartnersInquiryCategory): string | null {
  const external = category.formUrl?.trim()
  if (external) return external
  const slug = category.formSlug?.trim()
  if (slug) return `/forms/${slug}`
  return null
}

function mergeTracks(data: unknown): PartnersTrack[] {
  if (!Array.isArray(data)) return DEFAULT_PARTNERS_PAGE_CONFIG.tracks
  const merged = data
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const t = item as Partial<PartnersTrack>
      return {
        title: typeof t.title === 'string' ? t.title : '',
        description: typeof t.description === 'string' ? t.description : '',
      }
    })
    .filter((t) => t.title.trim().length > 0 || t.description.trim().length > 0)
  return merged.length > 0 ? merged : DEFAULT_PARTNERS_PAGE_CONFIG.tracks
}

function mergeInquiryCategories(data: unknown): PartnersInquiryCategory[] {
  const defaults = DEFAULT_PARTNERS_PAGE_CONFIG.inquiryCategories
  if (!Array.isArray(data) || data.length === 0) return defaults
  const merged = data
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const c = item as Partial<PartnersInquiryCategory>
      const fallback = defaults[index] || defaults[0]
      return {
        id:
          typeof c.id === 'string' && c.id.trim()
            ? c.id.trim()
            : fallback?.id || `inquiry-${index}`,
        label:
          typeof c.label === 'string' && c.label.trim()
            ? c.label.trim()
            : fallback?.label || 'Inquiry',
        formId: typeof c.formId === 'string' ? c.formId : '',
        formSlug: typeof c.formSlug === 'string' ? c.formSlug : '',
        formUrl: typeof c.formUrl === 'string' ? c.formUrl : '',
      }
    })
  return merged.length > 0 ? merged : defaults
}

function mergeFeaturedProjects(data: unknown): PartnersFeaturedProject[] {
  if (!Array.isArray(data)) return DEFAULT_PARTNERS_PAGE_CONFIG.featuredProjects
  return data
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const p = item as Partial<PartnersFeaturedProject>
      return {
        id: typeof p.id === 'string' && p.id ? p.id : `project-${index}`,
        title: typeof p.title === 'string' ? p.title : '',
        brief: typeof p.brief === 'string' ? p.brief : '',
        date: typeof p.date === 'string' ? p.date : '',
        location: typeof p.location === 'string' ? p.location : '',
        partnerNames: typeof p.partnerNames === 'string' ? p.partnerNames : '',
        imageURL: typeof p.imageURL === 'string' ? p.imageURL : '',
        ctaLabel: typeof p.ctaLabel === 'string' ? p.ctaLabel : '',
        ctaHref: typeof p.ctaHref === 'string' ? p.ctaHref : '',
      }
    })
    .filter((p) => p.title.trim().length > 0)
}

function mergePageConfig(data: unknown): PartnersPageConfig {
  const d = (data || {}) as Partial<PartnersPageConfig>
  const defaults = DEFAULT_PARTNERS_PAGE_CONFIG
  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : defaults.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : defaults.headline,
    body: typeof d.body === 'string' ? d.body : defaults.body,
    sponsorshipDeckEyebrow:
      typeof d.sponsorshipDeckEyebrow === 'string'
        ? d.sponsorshipDeckEyebrow
        : defaults.sponsorshipDeckEyebrow,
    sponsorshipDeckHeadline:
      typeof d.sponsorshipDeckHeadline === 'string'
        ? d.sponsorshipDeckHeadline
        : defaults.sponsorshipDeckHeadline,
    sponsorshipDeckBody:
      typeof d.sponsorshipDeckBody === 'string'
        ? d.sponsorshipDeckBody
        : defaults.sponsorshipDeckBody,
    sponsorshipDeckCTA:
      typeof d.sponsorshipDeckCTA === 'string'
        ? d.sponsorshipDeckCTA
        : defaults.sponsorshipDeckCTA,
    sponsorshipDeckPDFUrl:
      typeof d.sponsorshipDeckPDFUrl === 'string'
        ? d.sponsorshipDeckPDFUrl
        : defaults.sponsorshipDeckPDFUrl,
    tracksEyebrow:
      typeof d.tracksEyebrow === 'string' ? d.tracksEyebrow : defaults.tracksEyebrow,
    tracksHeadline:
      typeof d.tracksHeadline === 'string' ? d.tracksHeadline : defaults.tracksHeadline,
    tracks: mergeTracks(d.tracks),
    inquiryEyebrow:
      typeof d.inquiryEyebrow === 'string' ? d.inquiryEyebrow : defaults.inquiryEyebrow,
    inquiryHeadline:
      typeof d.inquiryHeadline === 'string' ? d.inquiryHeadline : defaults.inquiryHeadline,
    inquiryBody: typeof d.inquiryBody === 'string' ? d.inquiryBody : defaults.inquiryBody,
    inquiryCTA: typeof d.inquiryCTA === 'string' ? d.inquiryCTA : defaults.inquiryCTA,
    inquiryCategories: mergeInquiryCategories(d.inquiryCategories),
    trustedByLabel:
      typeof d.trustedByLabel === 'string' ? d.trustedByLabel : defaults.trustedByLabel,
    trustedBySubLabel:
      typeof d.trustedBySubLabel === 'string' ? d.trustedBySubLabel : defaults.trustedBySubLabel,
    trustedByDescription:
      typeof d.trustedByDescription === 'string'
        ? d.trustedByDescription
        : defaults.trustedByDescription,
    featuredProjects: mergeFeaturedProjects(d.featuredProjects),
    homepageCtaImageURL:
      typeof d.homepageCtaImageURL === 'string'
        ? d.homepageCtaImageURL
        : defaults.homepageCtaImageURL,
  }
}

export function mergePartnersConfig(
  data: Record<string, unknown> | undefined
): PartnersPlatformConfig {
  if (!data) return DEFAULT_PARTNERS_CONFIG
  return {
    pageConfig: mergePageConfig(data.pageConfig),
  }
}

async function fetchPartnersConfigFromApi(): Promise<Record<string, unknown> | undefined> {
  try {
    const res = await fetch('/api/platform-config/partners', { cache: 'no-store' })
    const json = await res.json()
    if (json.success && json.data) return json.data as Record<string, unknown>
  } catch (error) {
    console.error('[partners-config] API config fetch failed:', error)
  }
  return undefined
}

export function subscribeToPartnersConfig(
  callback: (config: PartnersPlatformConfig) => void
): () => void {
  let cancelled = false

  const apply = (data: Record<string, unknown> | undefined) => {
    if (!cancelled) callback(mergePartnersConfig(data))
  }

  const loadFallback = async () => {
    const data = await fetchPartnersConfigFromApi()
    if (data) apply(data)
    else if (!cancelled) callback(DEFAULT_PARTNERS_CONFIG)
  }

  try {
    const docRef = doc(db, 'platformConfig', 'partners')
    const unsub = onSnapshot(
      docRef,
      (snapshot) => apply(snapshot.exists() ? snapshot.data() : undefined),
      (error) => {
        console.error('[partners-config] Firestore listener failed:', error)
        void loadFallback()
      }
    )
    return () => {
      cancelled = true
      unsub()
    }
  } catch (error) {
    console.error('[partners-config] subscribe failed:', error)
    void loadFallback()
    return () => {
      cancelled = true
    }
  }
}
