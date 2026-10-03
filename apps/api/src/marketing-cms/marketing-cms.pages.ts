/** Prefill catalog: use-case + product surface pages for admin review. */

export type SeedPage = {
  slug: string;
  title: string;
  description: string;
  reviewStatus: 'pending_review' | 'approved';
  blocks: Array<{ type: string; sortOrder: number; content: Record<string, unknown> }>;
};

export const PRODUCT_PREFILLS = {
  translate: {
    source: 'en',
    target: 'sw',
    text: 'Welcome to our Lagos market partnership. We honor your time, your language, and a fair deal for both families.',
    note: 'Default trade/localization sample — review in CMS page slug product-translate.',
  },
  voice: {
    text: 'From Accra to Nairobi, your voice can teach, sell, and lead — without sounding imported.',
    ssml: '<speak>From Accra to Nairobi, your voice can <prosody rate="medium">teach, sell, and lead</prosody> — without sounding imported.</speak>',
    voice: 'alloy',
    note: 'Default creative/public-speech sample — review in CMS page slug product-voice.',
  },
  speech: {
    text: 'Karibu. Please share your order number so we can help in Kiswahili or English.',
    note: 'Default customer-experience sample — review in CMS page slug product-speech.',
  },
  dashboard: {
    welcome: 'Your African voice workspace is ready. Start with Translate, Voice, or Speech — samples are prefilled for common use cases.',
    note: 'Dashboard intro copy — review in CMS page slug product-dashboard.',
  },
} as const;

function articleBlocks(input: {
  kicker: string;
  title: string;
  lede: string;
  body: string[];
  sampleLabel: string;
  sampleText: string;
  ctas: Array<{ label: string; href: string }>;
  bullets?: string[];
}): SeedPage['blocks'] {
  return [
    {
      type: 'article_hero',
      sortOrder: 10,
      content: {
        kicker: input.kicker,
        title: input.title,
        lede: input.lede,
        ctas: input.ctas,
      },
    },
    {
      type: 'rich_text',
      sortOrder: 20,
      content: { paragraphs: input.body },
    },
    {
      type: 'sample_panel',
      sortOrder: 30,
      content: {
        label: input.sampleLabel,
        text: input.sampleText,
        note: 'Prefilled for demos. Admins can edit this block in Marketing CMS.',
      },
    },
    {
      type: 'checklist',
      sortOrder: 40,
      content: {
        title: 'What VerbaLab covers here',
        items: input.bullets ?? [
          'Accent-aware speech',
          'Translation with cultural tone',
          'Voice ownership for African creators and enterprises',
        ],
      },
    },
  ];
}

export const DEFAULT_CONTENT_PAGES: SeedPage[] = [
  {
    slug: 'use-case-trade',
    title: 'Trade & negotiations',
    description: 'Cross-border deals in the languages and tones partners respect.',
    reviewStatus: 'pending_review',
    blocks: articleBlocks({
      kicker: 'USE CASE',
      title: 'Trade & negotiations',
      lede: 'Close deals across West, East, and Southern Africa without losing respect, clarity, or intent.',
      body: [
        'Importers, exporters, and marketplace sellers need speech and translation that understands bargaining culture — greetings, deference, and firmness.',
        'VerbaLab prefills negotiation samples so teams can demo TTS, STT, and translation on day one, then refine copy in CMS.',
      ],
      sampleLabel: 'Sample negotiation opener',
      sampleText:
        'Asante for making time. We propose delivery in Mombasa within fourteen days, with payment terms that protect both sides.',
      ctas: [
        { label: 'Try Translate', href: '/translate' },
        { label: 'Open Voice', href: '/voice-studio' },
      ],
      bullets: [
        'Multilingual term sheets and voice notes',
        'Accent-aware call follow-ups',
        'Glossary support for trade vocabulary',
      ],
    }),
  },
  {
    slug: 'use-case-education',
    title: 'Education',
    description: 'Lessons and assessments in the languages students live in.',
    reviewStatus: 'pending_review',
    blocks: articleBlocks({
      kicker: 'USE CASE',
      title: 'Education',
      lede: 'Tutor, examine, and explain in mother tongues and school languages without flattening culture.',
      body: [
        'African classrooms are multilingual. Prefills cover lesson intros, parent updates, and quiz prompts teachers can adapt.',
        'Pair Translate with Voice so audio lessons reach learners who listen better than they read.',
      ],
      sampleLabel: 'Sample lesson intro',
      sampleText:
        'Today we learn fractions using market examples — sharing oranges in Accra and measuring maize in Kisumu.',
      ctas: [
        { label: 'Try Voice', href: '/voice-studio' },
        { label: 'Try Translate', href: '/translate' },
      ],
      bullets: ['Lesson TTS', 'Parent messaging', 'Assessment localization'],
    }),
  },
  {
    slug: 'use-case-sales',
    title: 'Sales & marketing',
    description: 'Campaigns that sound local — accents, idioms, and brand tone.',
    reviewStatus: 'pending_review',
    blocks: articleBlocks({
      kicker: 'USE CASE',
      title: 'Sales & marketing',
      lede: 'Ship ads, product videos, and outbound voice that feel native to each market.',
      body: [
        'Global templates fail when slogans ignore local humor and honorifics. Prefills give marketers a starting script per region.',
        'Clone brand voices ethically and keep pronunciation lexicons for product names.',
      ],
      sampleLabel: 'Sample campaign line',
      sampleText:
        'Your hustle deserves a bank that speaks your language — open in minutes, save in naira, grow with confidence.',
      ctas: [
        { label: 'Voice Studio', href: '/voice-studio' },
        { label: 'Speech hub', href: '/speech' },
      ],
      bullets: ['Ad voiceovers', 'Localized landing copy', 'Outbound dialer scripts'],
    }),
  },
  {
    slug: 'use-case-public-speech',
    title: 'Public speech',
    description: 'Civic and leadership addresses that feel native, not imported.',
    reviewStatus: 'pending_review',
    blocks: articleBlocks({
      kicker: 'USE CASE',
      title: 'Public speech',
      lede: 'Broadcasts, inaugurations, and community meetings with dignity in every accent.',
      body: [
        'Leaders need drafts that can be spoken aloud in English, French, Arabic, Swahili, and local languages without losing gravitas.',
        'Prefills include short address openers admins can localize in CMS before go-live.',
      ],
      sampleLabel: 'Sample address opener',
      sampleText:
        'My brothers and sisters, we gather not to borrow a voice from elsewhere, but to speak with the strength of our own languages.',
      ctas: [
        { label: 'Open Voice', href: '/voice-studio' },
        { label: 'Dashboard', href: '/dashboard' },
      ],
      bullets: ['Speech drafting', 'Multilingual delivery', 'Pronunciation control'],
    }),
  },
  {
    slug: 'use-case-customer-experience',
    title: 'Customer experience',
    description: 'Support that hears African callers the way Africans speak.',
    reviewStatus: 'pending_review',
    blocks: articleBlocks({
      kicker: 'USE CASE',
      title: 'Customer experience',
      lede: 'IVR, chat, and agent assist that handle code-switching and local phone manners.',
      body: [
        'Callers mix English with Yoruba, Swahili, or French mid-sentence. Prefills cover greeting and authentication flows.',
        'Speech + Translate hubs are linked so ops teams can rehearse scripts immediately.',
      ],
      sampleLabel: 'Sample support greeting',
      sampleText:
        'Sawubona! Thank you for calling. You can continue in Zulu or English — how can we help with your order today?',
      ctas: [
        { label: 'Speech hub', href: '/speech' },
        { label: 'Translate', href: '/translate' },
      ],
      bullets: ['STT for accents', 'Agent assist prompts', 'Multilingual IVR copy'],
    }),
  },
  {
    slug: 'use-case-creative',
    title: 'Creative voice',
    description: 'Podcasts, film, and storytelling owned by African creators.',
    reviewStatus: 'pending_review',
    blocks: articleBlocks({
      kicker: 'USE CASE',
      title: 'Creative voice',
      lede: 'Produce series, ads, and audiobooks without surrendering your voice to foreign defaults.',
      body: [
        'Creators get studio prefills for cold opens, trailers, and character lines.',
        'Voice cloning and lexicon tools stay in-console; narrative copy stays CMS-editable for producers.',
      ],
      sampleLabel: 'Sample podcast cold open',
      sampleText:
        'This week on Streets & Stories: how a tailor in Kano turned WhatsApp voice notes into a nationwide brand.',
      ctas: [
        { label: 'Voice Studio', href: '/voice-studio' },
        { label: 'Marketplace', href: '/marketplace' },
      ],
      bullets: ['Podcast TTS', 'Character voices', 'Trailer localization'],
    }),
  },
  {
    slug: 'product-translate',
    title: 'Translate product copy',
    description: 'Default form prefills and page copy for Translate.',
    reviewStatus: 'pending_review',
    blocks: [
      {
        type: 'product_prefill',
        sortOrder: 10,
        content: { surface: 'translate', ...PRODUCT_PREFILLS.translate },
      },
      {
        type: 'rich_text',
        sortOrder: 20,
        content: {
          paragraphs: [
            'Translate opens with a trade-oriented English→Swahili sample so reviewers hear African market tone immediately.',
            'Admins edit this prefill in CMS; the console reads it on load when the field is empty.',
          ],
        },
      },
    ],
  },
  {
    slug: 'product-voice',
    title: 'Voice product copy',
    description: 'Default TTS/SSML prefills for Voice Studio.',
    reviewStatus: 'pending_review',
    blocks: [
      {
        type: 'product_prefill',
        sortOrder: 10,
        content: { surface: 'voice', ...PRODUCT_PREFILLS.voice },
      },
      {
        type: 'rich_text',
        sortOrder: 20,
        content: {
          paragraphs: [
            'Voice Studio prefills a continent-spanning line plus SSML lite for pacing demos.',
          ],
        },
      },
    ],
  },
  {
    slug: 'product-speech',
    title: 'Speech product copy',
    description: 'Default TTS preview copy for Speech hub.',
    reviewStatus: 'pending_review',
    blocks: [
      {
        type: 'product_prefill',
        sortOrder: 10,
        content: { surface: 'speech', ...PRODUCT_PREFILLS.speech },
      },
      {
        type: 'rich_text',
        sortOrder: 20,
        content: {
          paragraphs: [
            'Speech hub quick preview uses a bilingual support greeting suitable for CX demos.',
          ],
        },
      },
    ],
  },
  {
    slug: 'product-dashboard',
    title: 'Dashboard product copy',
    description: 'Default dashboard welcome and hub blurbs.',
    reviewStatus: 'pending_review',
    blocks: [
      {
        type: 'product_prefill',
        sortOrder: 10,
        content: { surface: 'dashboard', ...PRODUCT_PREFILLS.dashboard },
      },
      {
        type: 'rich_text',
        sortOrder: 20,
        content: {
          paragraphs: [
            'Dashboard welcome text orients new admins toward prefilled product hubs and CMS review.',
          ],
        },
      },
    ],
  },
];

/** Map marketing home cards → CMS page slugs. */
export const USE_CASE_HOME_LINKS = [
  {
    title: 'Trade & negotiations',
    body: 'Speak and translate across markets without losing tone, respect, or intent.',
    imageKey: 'use-case.trade',
    href: '/use-cases/trade',
    pageSlug: 'use-case-trade',
  },
  {
    title: 'Education',
    body: 'Lessons, tutoring, and exams in the languages students actually live in.',
    imageKey: 'use-case.education',
    href: '/use-cases/education',
    pageSlug: 'use-case-education',
  },
  {
    title: 'Sales & marketing',
    body: 'Campaigns that sound local — accents, idioms, and cultural cues included.',
    href: '/use-cases/sales',
    pageSlug: 'use-case-sales',
  },
  {
    title: 'Public speech',
    body: 'Addresses, broadcasts, and civic messaging that feel native, not imported.',
    href: '/use-cases/public-speech',
    pageSlug: 'use-case-public-speech',
  },
  {
    title: 'Customer experience',
    body: 'Support and agents that hear African callers the way Africans speak.',
    href: '/use-cases/customer-experience',
    pageSlug: 'use-case-customer-experience',
  },
  {
    title: 'Creative voice',
    body: 'Own your voice for podcasts, film, ads, and storytelling across the continent.',
    href: '/use-cases/creative',
    pageSlug: 'use-case-creative',
  },
] as const;
