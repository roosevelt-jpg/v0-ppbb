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

export interface HomepagePillarItem {
  number: string
  title: string
  description: string
  imageURL: string
  ctaLabel: string
  ctaHref: string
}

export interface HomepagePillars {
  eyebrow: string
  headline: string
  items: HomepagePillarItem[]
}

export interface HomepageEventsSection {
  heading: string
  subheading: string
  maxEventsToShow: number
  ctaLabel: string
  ctaHref: string
}

export interface HomepageBannerButton {
  label: string
  href: string
  style: HeroButtonStyle
}

export interface HomepageDonationBanner {
  eyebrow: string
  headline: string
  body: string
  backgroundColor: string
  textColor: string
  buttons: HomepageBannerButton[]
}

export interface HomepageSocialYoutube {
  isEnabled: boolean
  channelId: string | null
  apiKey: string | null
  maxVideos: number
  heading: string
}

export interface HomepageSocialInstagram {
  isEnabled: boolean
  accessToken: string | null
  maxPosts: number
  heading: string
}

export interface HomepageSocialFeeds {
  youtube: HomepageSocialYoutube
  instagram: HomepageSocialInstagram
}

export interface HomepageTestimonialsSection {
  heading: string
}

export interface HomepageConfig {
  hero: HomepageHero
  stats: HomepageStats
  marquee: HomepageMarquee
  mission: HomepageMission
  pillars: HomepagePillars
  eventsSection: HomepageEventsSection
  donationBanner: HomepageDonationBanner
  socialFeeds: HomepageSocialFeeds
  testimonials: HomepageTestimonialsSection
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
  pillars: {
    eyebrow: 'SIX PILLARS',
    headline: 'How we move.',
    items: [
      {
        number: '01',
        title: 'Events & Community',
        description: 'Sisters, brothers, mixed and family gatherings — every week.',
        imageURL: '',
        ctaLabel: 'EXPLORE ↗',
        ctaHref: '/events',
      },
      {
        number: '02',
        title: 'Charity & Welfare',
        description: '2,000 weekly meals, Umrah sponsorship, orphan support and more.',
        imageURL: '',
        ctaLabel: 'EXPLORE ↗',
        ctaHref: '/donate',
      },
      {
        number: '03',
        title: 'Enterprise & Marketplace',
        description: 'A directory and marketplace for member-owned businesses.',
        imageURL: '',
        ctaLabel: 'EXPLORE ↗',
        ctaHref: '/marketplace',
      },
      {
        number: '04',
        title: 'Spiritual & Personal Growth',
        description: 'Weekly sessions, revert support, articles and recordings.',
        imageURL: '',
        ctaLabel: 'EXPLORE ↗',
        ctaHref: '/events?category=spiritual_workshop',
      },
      {
        number: '05',
        title: 'Partnerships',
        description: 'Government, corporate and grassroots collaborations.',
        imageURL: '',
        ctaLabel: 'EXPLORE ↗',
        ctaHref: '/partners',
      },
      {
        number: '06',
        title: 'Merchandise',
        description: 'Purpose-driven products. Every purchase fuels a cause.',
        imageURL: '',
        ctaLabel: 'EXPLORE ↗',
        ctaHref: '/shop',
      },
    ],
  },
  eventsSection: {
    heading: 'Upcoming Events',
    subheading: 'Join our community and participate in meaningful events',
    maxEventsToShow: 6,
    ctaLabel: 'View All Events →',
    ctaHref: '/events',
  },
  donationBanner: {
    eyebrow: 'GET INVOLVED',
    headline: 'Charity is the door. Community is the home.',
    body: 'Whether you donate, volunteer or simply show up — every blessing compounds. Pick how you want to begin.',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    buttons: [
      { label: 'Volunteer', href: '/volunteer', style: 'primary' },
      { label: 'Donate', href: '/donate', style: 'secondary' },
      { label: 'Contact us →', href: '/partners', style: 'text' },
    ],
  },
  socialFeeds: {
    youtube: {
      isEnabled: false,
      channelId: null,
      apiKey: null,
      maxVideos: 6,
      heading: 'Watch Our Story',
    },
    instagram: {
      isEnabled: false,
      accessToken: null,
      maxPosts: 9,
      heading: 'Follow Along',
    },
  },
  testimonials: {
    heading: 'Success Stories',
  },
}

function mergeHeroImages(data: Partial<HomepageHero>): HeroImage[] {
  const resolveUrl = (img: Record<string, unknown>): string => {
    if (typeof img.imageURL === 'string' && img.imageURL.length > 0) return img.imageURL
    if (typeof img.url === 'string' && img.url.length > 0) return img.url
    if (typeof img.imageUrl === 'string' && img.imageUrl.length > 0) return img.imageUrl
    return ''
  }

  const fromArray = Array.isArray(data.images)
    ? data.images
        .map((img, i) => {
          const raw = (img || {}) as Record<string, unknown>
          const imageURL = resolveUrl(raw)
          if (!imageURL) return null
          return {
            id: typeof raw.id === 'string' && raw.id ? raw.id : `hero-img-${i}`,
            imageURL,
            caption: typeof raw.caption === 'string' ? raw.caption : '',
          }
        })
        .filter((img): img is HeroImage => img !== null)
    : []

  if (fromArray.length > 0) return fromArray

  const legacyUrl =
    typeof data.imageURL === 'string' && data.imageURL
      ? data.imageURL
      : typeof (data as Record<string, unknown>).imageUrl === 'string'
        ? ((data as Record<string, unknown>).imageUrl as string)
        : ''

  if (legacyUrl) {
    return [
      {
        id: 'legacy-hero-0',
        imageURL: legacyUrl,
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
  const d = (data || {}) as Partial<HomepageMission> & { imageUrl?: string }
  const imageURL =
    typeof d.imageURL === 'string'
      ? d.imageURL
      : typeof d.imageUrl === 'string'
        ? d.imageUrl
        : d.imageURL === null
          ? null
          : DEFAULT_HOMEPAGE.mission.imageURL

  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_HOMEPAGE.mission.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : DEFAULT_HOMEPAGE.mission.headline,
    headlineItalicWord:
      typeof d.headlineItalicWord === 'string'
        ? d.headlineItalicWord
        : DEFAULT_HOMEPAGE.mission.headlineItalicWord,
    body: typeof d.body === 'string' ? d.body : DEFAULT_HOMEPAGE.mission.body,
    imageURL,
  }
}

function mergePillarItem(item: Partial<HomepagePillarItem>, fallback: HomepagePillarItem): HomepagePillarItem {
  return {
    number: typeof item.number === 'string' ? item.number : fallback.number,
    title: typeof item.title === 'string' ? item.title : fallback.title,
    description: typeof item.description === 'string' ? item.description : fallback.description,
    imageURL: typeof item.imageURL === 'string' ? item.imageURL : fallback.imageURL,
    ctaLabel: typeof item.ctaLabel === 'string' ? item.ctaLabel : fallback.ctaLabel,
    ctaHref: typeof item.ctaHref === 'string' ? item.ctaHref : fallback.ctaHref,
  }
}

function mergePillars(data: unknown): HomepagePillars {
  const d = (data || {}) as Partial<HomepagePillars>
  const defaults = DEFAULT_HOMEPAGE.pillars.items
  const items = Array.isArray(d.items)
    ? d.items
        .filter((item) => item && typeof item.title === 'string')
        .map((item, i) => mergePillarItem(item, defaults[i] || defaults[0]))
    : defaults

  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_HOMEPAGE.pillars.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : DEFAULT_HOMEPAGE.pillars.headline,
    items: items.length > 0 ? items : defaults,
  }
}

function mergeEventsSection(data: unknown): HomepageEventsSection {
  const d = (data || {}) as Partial<HomepageEventsSection>
  const max =
    typeof d.maxEventsToShow === 'number' && d.maxEventsToShow >= 3 && d.maxEventsToShow <= 8
      ? d.maxEventsToShow
      : DEFAULT_HOMEPAGE.eventsSection.maxEventsToShow

  return {
    heading: typeof d.heading === 'string' ? d.heading : DEFAULT_HOMEPAGE.eventsSection.heading,
    subheading:
      typeof d.subheading === 'string' ? d.subheading : DEFAULT_HOMEPAGE.eventsSection.subheading,
    maxEventsToShow: max,
    ctaLabel: typeof d.ctaLabel === 'string' ? d.ctaLabel : DEFAULT_HOMEPAGE.eventsSection.ctaLabel,
    ctaHref: typeof d.ctaHref === 'string' ? d.ctaHref : DEFAULT_HOMEPAGE.eventsSection.ctaHref,
  }
}

function mergeBannerButtons(buttons: unknown): HomepageBannerButton[] {
  if (!Array.isArray(buttons)) return DEFAULT_HOMEPAGE.donationBanner.buttons
  const merged = buttons
    .filter((b) => b && typeof b.label === 'string' && typeof b.href === 'string')
    .map((b) => ({
      label: b.label,
      href: b.href,
      style: (['primary', 'secondary', 'text'].includes(b.style as string)
        ? b.style
        : 'primary') as HeroButtonStyle,
    }))
  return merged.length > 0 ? merged : DEFAULT_HOMEPAGE.donationBanner.buttons
}

function mergeDonationBanner(data: unknown): HomepageDonationBanner {
  const d = (data || {}) as Partial<HomepageDonationBanner>
  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_HOMEPAGE.donationBanner.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : DEFAULT_HOMEPAGE.donationBanner.headline,
    body: typeof d.body === 'string' ? d.body : DEFAULT_HOMEPAGE.donationBanner.body,
    backgroundColor:
      typeof d.backgroundColor === 'string'
        ? d.backgroundColor
        : DEFAULT_HOMEPAGE.donationBanner.backgroundColor,
    textColor:
      typeof d.textColor === 'string' ? d.textColor : DEFAULT_HOMEPAGE.donationBanner.textColor,
    buttons: mergeBannerButtons(d.buttons),
  }
}

function mergeSocialFeeds(data: unknown): HomepageSocialFeeds {
  const d = (data || {}) as Partial<HomepageSocialFeeds>
  const yt = (d.youtube || {}) as Partial<HomepageSocialYoutube>
  const ig = (d.instagram || {}) as Partial<HomepageSocialInstagram>

  return {
    youtube: {
      isEnabled: yt.isEnabled === true,
      channelId: typeof yt.channelId === 'string' ? yt.channelId : null,
      apiKey: typeof yt.apiKey === 'string' ? yt.apiKey : null,
      maxVideos:
        typeof yt.maxVideos === 'number' && yt.maxVideos > 0
          ? yt.maxVideos
          : DEFAULT_HOMEPAGE.socialFeeds.youtube.maxVideos,
      heading:
        typeof yt.heading === 'string' ? yt.heading : DEFAULT_HOMEPAGE.socialFeeds.youtube.heading,
    },
    instagram: {
      isEnabled: ig.isEnabled === true,
      accessToken: typeof ig.accessToken === 'string' ? ig.accessToken : null,
      maxPosts:
        typeof ig.maxPosts === 'number' && ig.maxPosts > 0
          ? ig.maxPosts
          : DEFAULT_HOMEPAGE.socialFeeds.instagram.maxPosts,
      heading:
        typeof ig.heading === 'string' ? ig.heading : DEFAULT_HOMEPAGE.socialFeeds.instagram.heading,
    },
  }
}

function mergeTestimonialsSection(data: unknown): HomepageTestimonialsSection {
  const d = (data || {}) as Partial<HomepageTestimonialsSection>
  return {
    heading:
      typeof d.heading === 'string' ? d.heading : DEFAULT_HOMEPAGE.testimonials.heading,
  }
}

function mergeHomepage(data: Record<string, unknown> | undefined): HomepageConfig {
  if (!data) return DEFAULT_HOMEPAGE
  return {
    hero: mergeHero(data.hero),
    stats: mergeStats(data.stats),
    marquee: mergeMarquee(data.marquee),
    mission: mergeMission(data.mission),
    pillars: mergePillars(data.pillars),
    eventsSection: mergeEventsSection(data.eventsSection),
    donationBanner: mergeDonationBanner(data.donationBanner),
    socialFeeds: mergeSocialFeeds(data.socialFeeds),
    testimonials: mergeTestimonialsSection(data.testimonials),
  }
}

async function fetchHomepageFromApi(): Promise<Record<string, unknown> | undefined> {
  try {
    const res = await fetch('/api/platform-config/homepage', { cache: 'no-store' })
    const json = await res.json()
    if (json.success && json.data) {
      return json.data as Record<string, unknown>
    }
  } catch (error) {
    console.error('[homepage] API config fetch failed:', error)
  }
  return undefined
}

export function subscribeToHomepage(callback: (config: HomepageConfig) => void): () => void {
  let cancelled = false

  const apply = (data: Record<string, unknown> | undefined) => {
    if (!cancelled) callback(mergeHomepage(data))
  }

  const loadFallback = async () => {
    const data = await fetchHomepageFromApi()
    if (data) apply(data)
    else if (!cancelled) callback(DEFAULT_HOMEPAGE)
  }

  try {
    const docRef = doc(db, 'platformConfig', 'homepage')
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        apply(snapshot.exists() ? snapshot.data() : undefined)
      },
      (error) => {
        console.error('[homepage] Firestore listener denied or failed:', error)
        void loadFallback()
      }
    )
    return () => {
      cancelled = true
      unsub()
    }
  } catch (error) {
    console.error('[homepage] Firestore subscribe failed:', error)
    void loadFallback()
    return () => {
      cancelled = true
    }
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
