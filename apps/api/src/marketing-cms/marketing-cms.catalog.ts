/** Default VerbaLab marketing CMS seed — product UX patterns inspired by leading voice platforms; original VerbaLab African brand copy & assets. */

export const DEFAULT_DESIGN_SCOPE = {
  brand: 'VerbaLab',
  positioning: "Africa's voice intelligence platform",
  surfaces: ['marketing', 'console', 'playground', 'docs'],
  themes: ['light', 'dark', 'system'],
  typography: { display: 'Syne', body: 'DM Sans' },
  colorRoles: {
    brand: '#1a6b52',
    accent: '#6fcf9c',
    ink: { light: '#0a0a0a', dark: '#f4f7f5' },
    bg: { light: '#ffffff', dark: '#070907' },
  },
  motion: ['vl-fade-up', 'vl-soft-pulse', 'hero playground reveal'],
  components: [
    'site-nav',
    'theme-switcher',
    'hero-tts-playground',
    'product-cards',
    'logo-strip',
    'use-case-grid',
    'platform-split',
    'research-timeline',
    'safety-panel',
    'footer',
    'console-sidebar',
  ],
  imageSlots: [
    'hero.atmosphere',
    'product.voice',
    'product.speech',
    'product.translate',
    'use-case.trade',
    'use-case.education',
  ],
  honesty: {
    notElevenLabsCloneOfAssets: true,
    mirrorsProductUxPatterns: true,
    cmsManagedCopyAndMedia: true,
  },
};

export const DEFAULT_HOME_BLOCKS = [
  {
    type: 'nav',
    sortOrder: 0,
    content: {
      links: [
        { label: 'Products', href: '#products' },
        { label: 'Use cases', href: '#use-cases' },
        { label: 'Platform', href: '#platform' },
        { label: 'Research', href: '#research' },
        { label: 'Safety', href: '#safety' },
        { label: 'Docs', href: '/docs' },
      ],
      ctaPrimary: { label: 'Sign up', href: '/sign-up' },
      ctaSecondary: { label: 'Log in', href: '/sign-in' },
      consoleCta: { label: 'Open console', href: '/dev-login' },
    },
  },
  {
    type: 'hero',
    sortOrder: 10,
    content: {
      kicker: "AFRICA'S VOICE INTELLIGENCE PLATFORM",
      brand: 'VerbaLab',
      headline: 'Own every African voice',
      lede: 'Speak, translate, clone, and reason across ethnic languages, accents, and cultures — for trade, education, sales, public speech, and problem-solving.',
      primaryCta: { label: 'Start free', href: '/sign-up' },
      secondaryCta: { label: 'Open console', href: '/dev-login' },
      atmosphereImageKey: 'hero.atmosphere',
      playground: {
        title: 'Text to speech',
        sample:
          'Karibu. Across Lagos, Nairobi, Accra, and Johannesburg — VerbaLab speaks with Africa, not at Africa.',
        voices: [
          { id: 'alloy', label: 'Nia · Lagos', meta: 'Yoruba-English · warm' },
          { id: 'nova', label: 'Amina · Nairobi', meta: 'Swahili-English · clear' },
          { id: 'shimmer', label: 'Thandi · Johannesburg', meta: 'Zulu-English · bright' },
          { id: 'echo', label: 'Kwame · Accra', meta: 'Twi-English · grounded' },
        ],
        footnote: 'Dialect-aware African voices · cultural tone · multilingual TTS',
      },
    },
  },
  {
    type: 'logo_strip',
    sortOrder: 20,
    content: {
      label: 'Built for languages spoken across the continent',
      items: [
        'Yoruba',
        'Swahili',
        'Zulu',
        'Amharic',
        'Hausa',
        'Igbo',
        'Twi',
        'Wolof',
        'Afrikaans',
        'Arabic',
        'French',
        'Portuguese',
      ],
    },
  },
  {
    type: 'products',
    sortOrder: 30,
    content: {
      id: 'products',
      title: 'One platform for African voice, speech, and language',
      subtitle:
        'Product surfaces modeled after world-class AI voice consoles — purpose-built so Africans create, sell, teach, and negotiate in their own voices.',
      items: [
        {
          kicker: 'VerbaVoice',
          title: 'Text to speech & cloning',
          body: 'Generate and clone African voices for content, brands, and personal presence.',
          href: '/voice-studio',
          imageKey: 'product.voice',
        },
        {
          kicker: 'VerbaSpeech',
          title: 'Speech to text',
          body: 'Transcribe accents, dialects, and code-switching with speech intelligence built for Africa.',
          href: '/speech',
          imageKey: 'product.speech',
        },
        {
          kicker: 'VerbaTranslate',
          title: 'Translate every tongue',
          body: 'Move meaning across ethnic languages and global markets with cultural context intact.',
          href: '/translate',
          imageKey: 'product.translate',
        },
      ],
    },
  },
  {
    type: 'use_cases',
    sortOrder: 40,
    content: {
      id: 'use-cases',
      title: 'Why Africans choose VerbaLab',
      subtitle: 'Voice ownership for the moments that move economies and communities.',
      items: [
        {
          title: 'Trade & negotiations',
          body: 'Speak and translate across markets without losing tone, respect, or intent.',
          imageKey: 'use-case.trade',
        },
        {
          title: 'Education',
          body: 'Lessons, tutoring, and exams in the languages students actually live in.',
          imageKey: 'use-case.education',
        },
        {
          title: 'Sales & marketing',
          body: 'Campaigns that sound local — accents, idioms, and cultural cues included.',
        },
        {
          title: 'Public speech',
          body: 'Addresses, broadcasts, and civic messaging that feel native, not imported.',
        },
        {
          title: 'Customer experience',
          body: 'Support and agents that hear African callers the way Africans speak.',
        },
        {
          title: 'Creative voice',
          body: 'Own your voice for podcasts, film, ads, and storytelling across the continent.',
        },
      ],
    },
  },
  {
    type: 'platforms',
    sortOrder: 50,
    content: {
      id: 'platform',
      title: 'Two product surfaces. One research foundation.',
      items: [
        {
          title: 'VerbaCreative',
          body: 'Create ultra-realistic speech, localize campaigns, and craft voiceovers with African accent control.',
          href: '/voice-studio',
          bullets: ['TTS playground', 'Voice cloning', 'Pronunciation lexicon', 'Timeline render'],
        },
        {
          title: 'VerbaAgents',
          body: 'Deploy conversational agents that talk, type, and take action across African languages.',
          href: '/speech',
          bullets: ['STT + TTS', 'Interpreter', 'Workflows', 'Guardrails & analytics'],
        },
      ],
    },
  },
  {
    type: 'api',
    sortOrder: 60,
    content: {
      title: 'Or build anything with VerbaLab APIs',
      subtitle: 'Text to speech, speech to text, translate, and platform APIs with metering and residency.',
      cta: { label: 'Explore docs', href: '/docs' },
      code: `import { VerbaLab } from "@verbalab/sdk";

const client = new VerbaLab({ apiKey: process.env.VERBALAB_API_KEY });

await client.audio.speech({
  voice: "nia_lagos",
  text: "Karibu to VerbaLab.",
  format: "mp3",
});`,
    },
  },
  {
    type: 'research',
    sortOrder: 70,
    content: {
      id: 'research',
      title: 'Research that centers African language reality',
      items: [
        { date: '2024', title: 'African Language Registry', body: 'Canonical codes, dialects, and coverage tiers.' },
        { date: '2025', title: 'Accent & dialect intelligence', body: 'Speech models tuned for code-switching and local phonetics.' },
        { date: '2025', title: 'Cultural intelligence graph', body: 'Context for tone, greeting, and negotiation norms.' },
        { date: '2026', title: 'VAIOS orchestration', body: 'Unifying Kernel + Fabric + Data Plane for African workloads.' },
      ],
    },
  },
  {
    type: 'safety',
    sortOrder: 80,
    content: {
      id: 'safety',
      title: 'Safety, built in',
      items: [
        { title: 'Moderation', body: 'Monitor generated speech and misuse patterns.' },
        { title: 'Accountability', body: 'Org audit trails for voice, speech, and translation jobs.' },
        { title: 'Provenance', body: 'Label AI-generated audio for enterprise and civic use.' },
        { title: 'Residency', body: 'Regional deploy islands and data region pins.' },
      ],
    },
  },
  {
    type: 'footer',
    sortOrder: 90,
    content: {
      brand: 'VerbaLab',
      blurb: "Africa's own voice — for trade, learning, and creation.",
      links: [
        { label: 'Log in', href: '/sign-in' },
        { label: 'Console', href: '/dev-login' },
        { label: 'Docs', href: '/docs' },
        { label: 'CMS', href: '/cms', adminOnly: true },
        { label: 'Dashboard', href: '/dashboard', adminOnly: true },
      ],
    },
  },
] as const;

export const DEFAULT_ASSETS = [
  {
    key: 'hero.atmosphere',
    url: '/cms/hero-atmosphere.svg',
    alt: 'Abstract African sound-wave atmosphere for VerbaLab hero',
    kind: 'image',
  },
  {
    key: 'product.voice',
    url: '/cms/product-voice.svg',
    alt: 'VerbaVoice product visual',
    kind: 'image',
  },
  {
    key: 'product.speech',
    url: '/cms/product-speech.svg',
    alt: 'VerbaSpeech product visual',
    kind: 'image',
  },
  {
    key: 'product.translate',
    url: '/cms/product-translate.svg',
    alt: 'VerbaTranslate product visual',
    kind: 'image',
  },
  {
    key: 'use-case.trade',
    url: '/cms/use-trade.svg',
    alt: 'Trade and negotiations use case',
    kind: 'image',
  },
  {
    key: 'use-case.education',
    url: '/cms/use-education.svg',
    alt: 'Education use case',
    kind: 'image',
  },
] as const;
