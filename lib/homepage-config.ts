'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export type HeroButtonStyle = 'primary' | 'secondary' | 'text'

export type HeroTransitionType = 'fade' | 'slide'

export interface HeroButton {
  label: string
  href: string
  style: HeroButtonStyle
}

export interface HeroImage {
  id: string
  imageURL: string
  caption?: string
}

export interface HeroSlider {
  transition: HeroTransitionType
  speedSeconds: number
  autoplay: boolean
}

export interface HomepageHero {
  eyebrow: string
  headline: string
  body: string
  images: HeroImage[]
  slider: HeroSlider
  buttons: HeroButton[]
  /** @deprecated Legacy single image — migrated into `images` on read */
  imageURL?: string
  /** @deprecated Legacy caption — migrated into first slide on read */
  imageCaption?: string
}

export interface HomepageStatItem {
  number: string
  label: string
}

export interface HomepageStats {
  displayMode: 'static' | 'live'
  items: HomepageStatItem[]
}

export interface HomepageMarquee {
  speed: number
  gap: number
}

export interface HomepageMission {
  eyebrow: string
  headline: string
  headlineItalicWord: string
  body: string
  imageURL: string | null
}

export interface HomepageConfig {
  hero: HomepageHero
  stats: HomepageStats
  marquee: HomepageMarquee
  mission: HomepageMission
}

export const DEFAULT_HOMEPAGE: HomepageConfig = {
  hero: {
    eyebrow: 'ESTD 2025 — A MOVEMENT, NOT JUST A CHARITY',
    headline: 'Building a purpose-driven community.',
    body: "Through charity, growth and connection, Passive Blessings is UAE's leading impact led community who want to do more than donate. We act, build and rise together.",
    images: [],
    slider: {
      transition: 'fade',
      speedSeconds: 5,
      autoplay: true,
    },
    buttons: [
      { label: 'Join the community ↗', href: '/join', style: 'primary' },
      { label: 'Donate', href: '/donate', style: 'secondary' },
      { label: 'See events →', href: '/events', style: 'text' },
    ],
  },
  stats: {
    displayMode: 'static',
    items: [
      { number: '156,000+', label: 'MEALS SERVED' },
      { number: '3,000+', label: 'COMMUNITY MEMBERS' },
      { number: '50+', label: 'EVENTS HOSTED' },
      { number: '1M AED', label: 'FUND RAISED' },
    ],
  },
  marquee: {
    speed: 40,
    gap: 48,
  },
  mission: {
    eyebrow: 'OUR MISSION',
    headline: 'We are not a charity that simply collects. We are a community that builds.',
    headlineItalicWord: 'community',
    body: 'Passive Blessings exists to turn intention into action. Six interconnected pillars — community, charity, enterprise, spirituality, partnerships and merchandise — make giving and growing a way of life, not an annual gesture.',
    imageURL: null,
  },
}

function mergeHeroImages(data: Partial<HomepageHero>): HeroImage[] {
  const fromArray = Array.isArray(data.images)
    ? data.images
        .filter((img) => img && typeof img.imageURL === 'string' && img.imageURL.length > 0)
        .map((img, i) => ({
          id: typeof img.id === 'string' && img.id ? img.id : `hero-img-${i}`,
          imageURL: img.imageURL,
          caption: typeof img.caption === 'string' ? img.caption : '',
        }))
    : []

  if (fromArray.length > 0) return fromArray

  if (typeof data.imageURL === 'string' && data.imageURL) {
    return [
      {
        id: 'legacy-hero-0',
        imageURL: data.imageURL,
        caption: typeof data.imageCaption === 'string' ? data.imageCaption : '',
      },
    ]
  }

  return []
}

function mergeHeroSlider(data: Partial<HomepageHero>): HeroSlider {
  const raw = data.slider as Partial<HeroSlider> | undefined
  const speed =
    typeof raw?.speedSeconds === 'number' && raw.speedSeconds >= 2
      ? raw.speedSeconds
      : DEFAULT_HOMEPAGE.hero.slider.speedSeconds

  return {
    transition: raw?.transition === 'slide' ? 'slide' : 'fade',
    speedSeconds: speed,
    autoplay: raw?.autoplay !== false,
  }
}

function mergeHero(data: unknown): HomepageHero {
  const d = (data || {}) as Partial<HomepageHero>
  const buttons = Array.isArray(d.buttons)
    ? d.buttons
        .filter((b) => b && typeof b.label === 'string' && typeof b.href === 'string')
        .map((b) => ({
          label: b.label,
          href: b.href,
          style: (['primary', 'secondary', 'text'].includes(b.style as string)
            ? b.style
            : 'primary') as HeroButtonStyle,
        }))
    : DEFAULT_HOMEPAGE.hero.buttons

  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_HOMEPAGE.hero.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : DEFAULT_HOMEPAGE.hero.headline,
    body: typeof d.body === 'string' ? d.body : DEFAULT_HOMEPAGE.hero.body,
    images: mergeHeroImages(d),
    slider: mergeHeroSlider(d),
    buttons: buttons.length > 0 ? buttons : DEFAULT_HOMEPAGE.hero.buttons,
  }
}

function mergeStats(data: unknown): HomepageStats {
  const d = (data || {}) as Partial<HomepageStats>
  const items = Array.isArray(d.items)
    ? d.items
        .filter((item) => item && typeof item.number === 'string' && typeof item.label === 'string')
        .map((item) => ({ number: item.number, label: item.label }))
    : DEFAULT_HOMEPAGE.stats.items

  return {
    displayMode: d.displayMode === 'live' ? 'live' : 'static',
    items: items.length > 0 ? items : DEFAULT_HOMEPAGE.stats.items,
  }
}

function mergeMarquee(data: unknown): HomepageMarquee {
  const d = (data || {}) as Partial<HomepageMarquee>
  return {
    speed: typeof d.speed === 'number' && d.speed > 0 ? d.speed : DEFAULT_HOMEPAGE.marquee.speed,
    gap: typeof d.gap === 'number' && d.gap >= 0 ? d.gap : DEFAULT_HOMEPAGE.marquee.gap,
  }
}

function mergeMission(data: unknown): HomepageMission {
  const d = (data || {}) as Partial<HomepageMission>
  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_HOMEPAGE.mission.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : DEFAULT_HOMEPAGE.mission.headline,
    headlineItalicWord:
      typeof d.headlineItalicWord === 'string'
        ? d.headlineItalicWord
        : DEFAULT_HOMEPAGE.mission.headlineItalicWord,
    body: typeof d.body === 'string' ? d.body : DEFAULT_HOMEPAGE.mission.body,
    imageURL: typeof d.imageURL === 'string' ? d.imageURL : d.imageURL === null ? null : DEFAULT_HOMEPAGE.mission.imageURL,
  }
}

function mergeHomepage(data: Record<string, unknown> | undefined): HomepageConfig {
  if (!data) return DEFAULT_HOMEPAGE
  return {
    hero: mergeHero(data.hero),
    stats: mergeStats(data.stats),
    marquee: mergeMarquee(data.marquee),
    mission: mergeMission(data.mission),
  }
}

export function subscribeToHomepage(callback: (config: HomepageConfig) => void): () => void {
  try {
    const docRef = doc(db, 'platformConfig', 'homepage')
    return onSnapshot(
      docRef,
      (snapshot) => {
        callback(mergeHomepage(snapshot.exists() ? snapshot.data() : undefined))
      },
      () => callback(DEFAULT_HOMEPAGE)
    )
  } catch {
    callback(DEFAULT_HOMEPAGE)
    return () => {}
  }
}

/** Split mission headline to italicize one word in Cormorant Garamond */
export function splitMissionHeadline(
  headline: string,
  italicWord: string
): { before: string; italic: string; after: string } | null {
  if (!italicWord || !headline.includes(italicWord)) return null
  const idx = headline.indexOf(italicWord)
  return {
    before: headline.slice(0, idx),
    italic: italicWord,
    after: headline.slice(idx + italicWord.length),
  }
}

/** Parse hero image caption: uppercase prefix + italic suffix after " since " */
export function splitImageCaption(caption: string): { prefix: string; italic: string } {
  const marker = ' since '
  const idx = caption.toLowerCase().indexOf(' since ')
  if (idx === -1) return { prefix: caption.toUpperCase(), italic: '' }
  return {
    prefix: caption.slice(0, idx).toUpperCase(),
    italic: caption.slice(idx + marker.length - 1).trim(),
  }
}
