'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export interface AboutHero {
  eyebrow: string
  headline: string
  body: string
}

export interface AboutStory {
  eyebrow: string
  founderImageURL: string | null
  founderImageAlt: string
  paragraphs: string[]
  pullQuote: string
}

export interface AboutDifferentiator {
  number: string
  title: string
  description: string
}

export interface AboutValueItem {
  title: string
  description: string
}

export interface AboutValues {
  eyebrow: string
  headline: string
  differentiators: AboutDifferentiator[]
  valuesHeading: string
  values: AboutValueItem[]
}

export interface AboutTeamSection {
  eyebrow: string
  headline: string
}

export interface AboutMissionVision {
  missionHeadline: string
  missionBody: string
  visionHeadline: string
  visionBody: string
  imageURL: string | null
}

export interface AboutConfig {
  hero: AboutHero
  story: AboutStory
  missionVision: AboutMissionVision
  values: AboutValues
  team: AboutTeamSection
}

export const DEFAULT_ABOUT: AboutConfig = {
  hero: {
    eyebrow: 'ABOUT',
    headline: 'A movement built on intention, action and one another.',
    body: 'Passive Blessings began with a simple idea: that quiet, consistent good done together compounds into something extraordinary.',
  },
  story: {
    eyebrow: 'OUR STORY',
    founderImageURL: null,
    founderImageAlt: 'Yusef Bouattoura, Founder',
    paragraphs: [
      'Founded in 2025 by Yusef Bouattoura, Passive Blessings was born from a frustration and a vision. The frustration: charity that begins and ends with a transaction. The vision: a community where giving, growing and gathering are inseparable.',
      'What started as weekly meal distributions has grown into a six-pillar ecosystem touching thousands of lives. Sisters meet for halaqa. Brothers mentor one another. Entrepreneurs find their first customers. Reverts find their first family.',
    ],
    pullQuote:
      'We are not building an organisation. We are building a way of life. Another day Another Blessing',
  },
  missionVision: {
    missionHeadline: 'Our Mission',
    missionBody:
      'Our mission is to build a thriving community platform that empowers individuals, businesses, and organizations to make a meaningful impact through collective action.',
    visionHeadline: 'Our Vision',
    visionBody:
      'A world where compassion, collaboration, and charitable action drive sustainable community development.',
    imageURL: null,
  },
  values: {
    eyebrow: 'WHAT MAKES US DIFFERENT',
    headline: 'Not just charity. A community engine.',
    differentiators: [
      {
        number: '01',
        title: 'Community-led',
        description:
          'Decisions and direction emerge from the people we serve — not from a boardroom.',
      },
      {
        number: '02',
        title: 'Action-based',
        description:
          'We measure success in meals served, members supported and lives moved — not pledges.',
      },
      {
        number: '03',
        title: 'Six pillars, one mission',
        description:
          'Charity is the gateway. Brotherhood, sisterhood, enterprise and spirituality are the home.',
      },
    ],
    valuesHeading: 'Our Values',
    values: [
      {
        title: 'Community First',
        description: 'Building strong, inclusive communities where every voice matters',
      },
      {
        title: 'Integrity',
        description: 'Operating with transparency, honesty, and accountability',
      },
      {
        title: 'Impact',
        description: 'Creating measurable positive change in society',
      },
      {
        title: 'Collaboration',
        description: 'Working together across differences to achieve shared goals',
      },
      {
        title: 'Empowerment',
        description: 'Enabling individuals and businesses to reach their potential',
      },
      {
        title: 'Sustainability',
        description: 'Building long-term solutions for community challenges',
      },
    ],
  },
  team: {
    eyebrow: 'LEADERSHIP',
    headline: 'The team.',
  },
}

function mergeHero(data: unknown): AboutHero {
  const d = (data || {}) as Partial<AboutHero>
  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_ABOUT.hero.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : DEFAULT_ABOUT.hero.headline,
    body: typeof d.body === 'string' ? d.body : DEFAULT_ABOUT.hero.body,
  }
}

function mergeStory(data: unknown): AboutStory {
  const d = (data || {}) as Partial<AboutStory>
  const paragraphs = Array.isArray(d.paragraphs)
    ? d.paragraphs.filter((p): p is string => typeof p === 'string')
    : DEFAULT_ABOUT.story.paragraphs

  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_ABOUT.story.eyebrow,
    founderImageURL:
      typeof d.founderImageURL === 'string'
        ? d.founderImageURL
        : d.founderImageURL === null
          ? null
          : DEFAULT_ABOUT.story.founderImageURL,
    founderImageAlt:
      typeof d.founderImageAlt === 'string'
        ? d.founderImageAlt
        : DEFAULT_ABOUT.story.founderImageAlt,
    paragraphs: paragraphs.length > 0 ? paragraphs : DEFAULT_ABOUT.story.paragraphs,
    pullQuote: typeof d.pullQuote === 'string' ? d.pullQuote : DEFAULT_ABOUT.story.pullQuote,
  }
}

function mergeValues(data: unknown): AboutValues {
  const d = (data || {}) as Partial<AboutValues>
  const differentiators = Array.isArray(d.differentiators)
    ? d.differentiators
        .filter((item) => item && typeof item.title === 'string')
        .map((item, i) => ({
          number:
            typeof item.number === 'string'
              ? item.number
              : DEFAULT_ABOUT.values.differentiators[i]?.number || String(i + 1).padStart(2, '0'),
          title: item.title,
          description:
            typeof item.description === 'string'
              ? item.description
              : DEFAULT_ABOUT.values.differentiators[i]?.description || '',
        }))
    : DEFAULT_ABOUT.values.differentiators

  const values = Array.isArray(d.values)
    ? d.values
        .filter((item) => item && typeof item.title === 'string')
        .map((item, i) => ({
          title: item.title,
          description:
            typeof item.description === 'string'
              ? item.description
              : DEFAULT_ABOUT.values.values[i]?.description || '',
        }))
    : DEFAULT_ABOUT.values.values

  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_ABOUT.values.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : DEFAULT_ABOUT.values.headline,
    differentiators:
      differentiators.length > 0 ? differentiators : DEFAULT_ABOUT.values.differentiators,
    valuesHeading:
      typeof d.valuesHeading === 'string'
        ? d.valuesHeading
        : DEFAULT_ABOUT.values.valuesHeading,
    values: values.length > 0 ? values : DEFAULT_ABOUT.values.values,
  }
}

function mergeMissionVision(data: unknown): AboutMissionVision {
  const d = (data || {}) as Partial<AboutMissionVision>
  return {
    missionHeadline:
      typeof d.missionHeadline === 'string'
        ? d.missionHeadline
        : DEFAULT_ABOUT.missionVision.missionHeadline,
    missionBody:
      typeof d.missionBody === 'string'
        ? d.missionBody
        : DEFAULT_ABOUT.missionVision.missionBody,
    visionHeadline:
      typeof d.visionHeadline === 'string'
        ? d.visionHeadline
        : DEFAULT_ABOUT.missionVision.visionHeadline,
    visionBody:
      typeof d.visionBody === 'string'
        ? d.visionBody
        : DEFAULT_ABOUT.missionVision.visionBody,
    imageURL:
      typeof d.imageURL === 'string'
        ? d.imageURL
        : d.imageURL === null
          ? null
          : DEFAULT_ABOUT.missionVision.imageURL,
  }
}

function mergeTeam(data: unknown): AboutTeamSection {
  const d = (data || {}) as Partial<AboutTeamSection>
  return {
    eyebrow: typeof d.eyebrow === 'string' ? d.eyebrow : DEFAULT_ABOUT.team.eyebrow,
    headline: typeof d.headline === 'string' ? d.headline : DEFAULT_ABOUT.team.headline,
  }
}

function mergeAbout(data: Record<string, unknown> | undefined): AboutConfig {
  if (!data) return DEFAULT_ABOUT
  return {
    hero: mergeHero(data.hero),
    story: mergeStory(data.story),
    missionVision: mergeMissionVision(data.missionVision),
    values: mergeValues(data.values),
    team: mergeTeam(data.team),
  }
}

async function fetchAboutFromApi(): Promise<Record<string, unknown> | undefined> {
  try {
    const res = await fetch('/api/platform-config/about', { cache: 'no-store' })
    const json = await res.json()
    if (json.success && json.data) return json.data as Record<string, unknown>
  } catch (error) {
    console.error('[about] API config fetch failed:', error)
  }
  return undefined
}

export function subscribeToAbout(callback: (config: AboutConfig) => void): () => void {
  let cancelled = false

  const apply = (data: Record<string, unknown> | undefined) => {
    if (!cancelled) callback(mergeAbout(data))
  }

  const loadFallback = async () => {
    const data = await fetchAboutFromApi()
    if (data) apply(data)
    else if (!cancelled) callback(DEFAULT_ABOUT)
  }

  try {
    const docRef = doc(db, 'platformConfig', 'about')
    const unsub = onSnapshot(
      docRef,
      (snapshot) => apply(snapshot.exists() ? snapshot.data() : undefined),
      (error) => {
        console.error('[about] Firestore listener denied or failed:', error)
        void loadFallback()
      }
    )
    return () => {
      cancelled = true
      unsub()
    }
  } catch (error) {
    console.error('[about] Firestore subscribe failed:', error)
    void loadFallback()
    return () => {
      cancelled = true
    }
  }
}
