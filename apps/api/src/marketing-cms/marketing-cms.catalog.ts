/** Default VerbaLab marketing CMS seed — product UX patterns inspired by leading voice platforms; original VerbaLab African brand copy & assets. */

import { USE_CASE_HOME_LINKS } from './marketing-cms.pages';

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
    'product-hub-tabs',
    'product-cards',
    'logo-strip',
    'use-case-grid',
    'platform-split',
    'feature-deep-dive',
    'impact-grid',
    'api-split',
    'research-timeline',
    'safety-panel',
    'updates-grid',
    'final-cta',
    'footer-columns',
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
  northStar:
    'Match and exceed world-class AI voice platforms — owned by Africa, for African languages, accents, and economies.',
  honesty: {
    notThirdPartyCloneOfAssets: true,
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
        { label: 'Hubs', href: '#hubs' },
        { label: 'Use cases', href: '#use-cases' },
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
          href: '/products/text-to-speech',
          imageKey: 'product.voice',
        },
        {
          kicker: 'VerbaSpeech',
          title: 'Speech to text',
          body: 'Transcribe accents, dialects, and code-switching with speech intelligence built for Africa.',
          href: '/products/speech-to-text',
          imageKey: 'product.speech',
        },
        {
          kicker: 'VerbaTranslate',
          title: 'Translate every tongue',
          body: 'Move meaning across ethnic languages and global markets with cultural context intact.',
          href: '/products/translate-api',
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
      items: USE_CASE_HOME_LINKS.map((link) => ({
        title: link.title,
        body: link.body,
        href: link.href,
        ...('imageKey' in link && link.imageKey ? { imageKey: link.imageKey } : {}),
      })),
    },
  },
  {
    type: 'product_hubs',
    sortOrder: 45,
    content: {
      id: 'hubs',
      title: 'Three ways to ship African voice',
      subtitle: 'Creative studio, conversational agents, and APIs — same research foundation, same ownership model.',
      tabs: [
        {
          id: 'creative',
          label: 'VerbaCreative',
          blurb: 'Produce speech, campaigns, and story worlds that sound local.',
          href: '/voice-studio',
          pills: ['TTS', 'STT', 'Clone', 'SFX', 'Music', 'Image', 'Video', 'Ads'],
        },
        {
          id: 'agents',
          label: 'VerbaAgents',
          blurb: 'Agents that hear code-switching and answer with respect.',
          href: '/agent-intelligence',
          pills: ['Voice agents', 'Support', 'Verticals', 'Workflows', 'Analytics'],
        },
        {
          id: 'api',
          label: 'VerbaAPI',
          blurb: 'Metered APIs with residency for builders across the continent.',
          href: '/docs/openapi',
          pills: ['TTS', 'STT', 'Dubbing', 'SFX', 'Music', 'SDKs'],
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
    type: 'feature_deep_dive',
    sortOrder: 55,
    content: {
      id: 'creative-deep',
      kicker: 'VERBACREATIVE',
      title: 'Create, edit, and localize in African languages',
      lede: 'Scripts, voices, and delivery tuned for markets from Lagos to Nairobi — not imported defaults.',
      cta: { label: 'Open Voice Studio', href: '/voice-studio' },
      preview: {
        label: 'Studio sample',
        text: 'Karibu. Your brand can greet customers in Swahili, close in English, and keep the same voice identity.',
        languages: ['English', 'Swahili', 'Yoruba', 'Amharic', 'Zulu', 'Hausa'],
      },
      cards: [
        {
          title: 'Voices',
          body: 'Accent-aware libraries for creators, educators, and public broadcasters.',
        },
        {
          title: 'Cloning',
          body: 'Ethical voice ownership with consent, watermarking, and review gates.',
        },
        {
          title: 'Dubbing & localize',
          body: 'Move meaning across ethnic languages without flattening tone.',
        },
        {
          title: 'Design',
          body: 'Shape new voices for characters, brands, and civic messaging.',
        },
      ],
    },
  },
  {
    type: 'feature_deep_dive',
    sortOrder: 56,
    content: {
      id: 'agents-deep',
      kicker: 'VERBAAGENTS',
      title: 'Deploy agents that talk, type, and act',
      lede: 'Support, sales, and civic agents built for bilingual callers and low-latency African networks.',
      cta: { label: 'Open Speech hub', href: '/speech' },
      preview: {
        label: 'Agent transcript',
        text: 'Caller: "Habari, nina shida na order yangu." · Agent: "Karibu — let’s check that order in Kiswahili or English."',
        languages: ['Swahili↔English', 'Yoruba↔English', 'French↔Wolof'],
      },
      cards: [
        { title: 'Fastest paths', body: 'Streaming STT/TTS paths designed for real call-center latency.' },
        { title: 'Human-like', body: 'Turn-taking that respects greetings, deference, and code-switch.' },
        { title: 'Omni-channel', body: 'Same agent logic for phone, chat, and WhatsApp-style flows.' },
        { title: 'Guardrails', body: 'Moderation, audit, and provenance before agents go live.' },
      ],
    },
  },
  {
    type: 'api',
    sortOrder: 60,
    content: {
      title: 'Or build anything with VerbaLab APIs',
      subtitle:
        'Text to speech, speech to text, translate, chat, and platform APIs — with metering, keys, and regional residency.',
      cta: { label: 'Explore docs', href: '/docs' },
      endpoints: [
        { name: 'Speech', href: '/docs' },
        { name: 'Translate', href: '/translate' },
        { name: 'Playground', href: '/playground' },
        { name: 'African Voice LLM', href: '/chat' },
      ],
      code: `import { VerbaLab } from "@verbalab/sdk";

const client = new VerbaLab({ apiKey: process.env.VERBALAB_API_KEY });

await client.audio.speech({
  voice: "nia_lagos",
  text: "Karibu to VerbaLab — Africa owns this voice.",
  format: "mp3",
});`,
    },
  },
  {
    type: 'impact',
    sortOrder: 65,
    content: {
      id: 'impact',
      title: 'Impact across the continent',
      subtitle: 'Prefill stories for partnerships, creators, and civic programs — replace with real wins as they land.',
      items: [
        {
          title: 'Language sovereignty',
          body: 'African orgs keep ownership of speech data and voice identities used on VerbaLab.',
        },
        {
          title: 'Creator economy',
          body: 'Podcasters and filmmakers ship in mother tongues without surrendering their voice IP.',
        },
        {
          title: 'Public infrastructure',
          body: 'Education, trade, and government messaging that sounds native — not imported.',
        },
      ],
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
    type: 'updates',
    sortOrder: 85,
    content: {
      id: 'updates',
      title: 'Latest on the platform',
      items: [
        {
          title: 'Marketing CMS + theme',
          body: 'Ship homepage copy, images, and light/dark design from an admin console.',
          href: '/cms',
        },
        {
          title: 'Use-case prefills',
          body: 'Trade, education, sales, public speech, CX, and creative pages ready for review.',
          href: '/use-cases/trade',
        },
        {
          title: 'Local review console',
          body: 'Sidebar hubs + /dev-login so teams can build without OTP friction.',
          href: '/dev-login',
        },
      ],
    },
  },
  {
    type: 'final_cta',
    sortOrder: 88,
    content: {
      title: "Africa's AI communication platform",
      lede: 'Own the stack that speaks for the continent — creative, agents, and APIs under one roof.',
      primaryCta: { label: 'Start building', href: '/dev-login' },
      secondaryCta: { label: 'Talk to us', href: '/sign-up' },
    },
  },
  {
    type: 'footer',
    sortOrder: 90,
    content: {
      brand: 'VerbaLab',
      blurb: "Africa's own voice — for trade, learning, creation, and public life.",
      columns: [
        {
          title: 'VerbaCreative',
          links: [
            { label: 'Text to Speech', href: '/products/text-to-speech' },
            { label: 'Speech to Text', href: '/products/speech-to-text' },
            { label: 'Voice Changer', href: '/products/voice-changer' },
            { label: 'Text to Sound Effects', href: '/products/text-to-sound-effects' },
            { label: 'Voice Cloning', href: '/products/voice-cloning' },
            { label: 'Voice Isolator', href: '/products/voice-isolator' },
            { label: 'AI Music Generator', href: '/products/ai-music-generator' },
            { label: 'Studio', href: '/products/studio' },
            { label: 'Voice Design', href: '/products/voice-design' },
            { label: 'AI Voice Generator', href: '/products/ai-voice-generator' },
            { label: 'AI Image Generator', href: '/products/ai-image-generator' },
            { label: 'AI Video Generator', href: '/products/ai-video-generator' },
            { label: 'Ads Engine', href: '/products/ads-engine' },
            { label: 'Dubbing', href: '/products/dubbing' },
          ],
        },
        {
          title: 'VerbaAgents',
          links: [
            { label: 'Voice Agents', href: '/products/voice-agents' },
            { label: 'Agent Voice Training', href: '/products/agent-voice-training' },
            { label: 'Conversational AI', href: '/products/conversational-ai' },
            { label: 'Integrations', href: '/products/integrations' },
            { label: 'Telecommunications', href: '/products/telecommunications' },
            { label: 'Financial Services', href: '/products/financial-services' },
            { label: 'Healthcare', href: '/products/healthcare' },
            { label: 'Government', href: '/products/government' },
            { label: 'Technology', href: '/products/technology' },
            { label: 'Retail & E-commerce', href: '/products/retail-ecommerce' },
            { label: 'Travel & Hospitality', href: '/products/travel-hospitality' },
            { label: 'Customer Support', href: '/products/customer-support' },
            { label: 'Chatbots', href: '/products/chatbots' },
            { label: 'Education', href: '/products/education' },
          ],
        },
        {
          title: 'VerbaAPI',
          links: [
            { label: 'API Reference', href: '/products/api-reference' },
            { label: 'Agents API', href: '/products/agents-api' },
            { label: 'Speech Engine', href: '/products/speech-engine' },
            { label: 'Dubbing API', href: '/products/dubbing-api' },
            { label: 'Text to Speech API', href: '/products/text-to-speech-api' },
            { label: 'Speech to Text API', href: '/products/speech-to-text-api' },
            { label: 'Sound Effects API', href: '/products/sound-effects-api' },
            { label: 'Music API', href: '/products/music-api' },
            { label: 'Translate API', href: '/products/translate-api' },
            { label: 'iOS SDK', href: '/products/ios-sdk' },
            { label: 'Android SDK', href: '/products/android-sdk' },
            { label: 'API Key', href: '/products/api-key' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Docs', href: '/products/docs' },
            { label: 'OpenAPI explorer', href: '/products/openapi-explorer' },
            { label: 'Playground', href: '/products/playground' },
            { label: 'Marketplace', href: '/products/marketplace' },
            { label: 'Enterprise', href: '/products/enterprise' },
            { label: 'Trust Center', href: '/products/trust-center' },
            { label: 'Coverage', href: '/products/coverage' },
            { label: 'Developers', href: '/products/developers' },
          ],
        },
        {
          title: 'Socials',
          links: [
            { label: 'X', href: 'https://x.com' },
            { label: 'LinkedIn', href: 'https://www.linkedin.com' },
            { label: 'GitHub', href: 'https://github.com/roosevelt-jpg/verbalab' },
            { label: 'YouTube', href: 'https://www.youtube.com' },
            { label: 'Discord', href: 'https://discord.com' },
            { label: 'TikTok', href: 'https://www.tiktok.com' },
            { label: 'Instagram', href: 'https://www.instagram.com' },
            { label: 'Facebook', href: 'https://www.facebook.com' },
            { label: 'Reddit', href: 'https://www.reddit.com' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About', href: '/' },
            { label: 'Log in', href: '/sign-in' },
            { label: 'Safety', href: '#safety' },
            { label: 'Policies', href: '/data' },
            // Auth-only: visible after login (any user or admin) — never on public homepage footer.
            { label: 'Console', href: '/dev-login', authOnly: true },
            { label: 'Brand & Press', href: '/cms', authOnly: true },
            { label: 'CMS', href: '/cms', authOnly: true },
            { label: 'Dashboard', href: '/dashboard', authOnly: true },
          ],
        },
      ],
      links: [
        { label: 'Log in', href: '/sign-in' },
        { label: 'Docs', href: '/docs' },
        { label: 'Console', href: '/dev-login', authOnly: true },
        { label: 'CMS', href: '/cms', authOnly: true },
        { label: 'Dashboard', href: '/dashboard', authOnly: true },
      ],
    },
  },
] as const;

export const DEFAULT_ASSETS = [
  {
    key: 'hero.atmosphere',
    url: '/cms/hero-atmosphere.svg',
    alt: '3D anamorphic VerbaLab hero atmosphere — replace anytime in CMS',
    kind: 'image',
  },
  {
    key: 'product.voice',
    url: '/cms/product-voice.svg',
    alt: '3D VerbaVoice product visual — CMS replaceable',
    kind: 'image',
  },
  {
    key: 'product.speech',
    url: '/cms/product-speech.svg',
    alt: '3D VerbaSpeech product visual — CMS replaceable',
    kind: 'image',
  },
  {
    key: 'product.translate',
    url: '/cms/product-translate.svg',
    alt: '3D VerbaTranslate product visual — CMS replaceable',
    kind: 'image',
  },
  {
    key: 'use-case.trade',
    url: '/cms/use-trade.svg',
    alt: '3D trade and negotiations use case visual — CMS replaceable',
    kind: 'image',
  },
  {
    key: 'use-case.education',
    url: '/cms/use-education.svg',
    alt: '3D education use case visual — CMS replaceable',
    kind: 'image',
  },
  {
    key: 'use-case.sales',
    url: '/cms/use-sales.svg',
    alt: '3D sales and marketing use case visual — CMS replaceable',
    kind: 'image',
  },
  {
    key: 'use-case.public-speech',
    url: '/cms/use-public-speech.svg',
    alt: '3D public speech use case visual — CMS replaceable',
    kind: 'image',
  },
  {
    key: 'use-case.customer-experience',
    url: '/cms/use-customer-experience.svg',
    alt: '3D customer experience use case visual — CMS replaceable',
    kind: 'image',
  },
  {
    key: 'use-case.creative',
    url: '/cms/use-creative.svg',
    alt: '3D creative voice use case visual — CMS replaceable',
    kind: 'image',
  },
] as const;
