import type { ProductPage } from '@/lib/product-pages';

export type ProductUseCase = {
  title: string;
  scenario: string;
  outcome: string;
};

export type ProductDemoKind =
  | 'tts'
  | 'stt'
  | 'translate'
  | 'detect'
  | 'chat'
  | 'languages'
  | 'voices'
  | 'coverage'
  | 'api'
  | 'console';

export type ProductStory = {
  overview: string;
  howItWorks: string[];
  useCases: ProductUseCase[];
  demoKind: ProductDemoKind;
  demoTitle: string;
  demoBlurb: string;
  samplePrompt: string;
  sampleCode: string;
  proofPoints: string[];
};

function demoForSlug(slug: string, family: ProductPage['family']): ProductDemoKind {
  if (
    slug.includes('speech-to-text') ||
    slug === 'speech-engine' ||
    slug === 'voice-isolator'
  ) {
    return 'stt';
  }
  if (
    slug.includes('text-to-speech') ||
    slug.includes('voice') ||
    slug === 'studio' ||
    slug === 'ai-voice-generator' ||
    slug === 'dubbing' ||
    slug === 'dubbing-api' ||
    slug === 'sound-effects-api' ||
    slug === 'text-to-sound-effects' ||
    slug === 'ai-music-generator' ||
    slug === 'music-api'
  ) {
    return 'tts';
  }
  if (slug.includes('translate')) return 'translate';
  if (slug.includes('chat') || slug.includes('conversational') || slug.includes('agents')) {
    return 'chat';
  }
  if (slug === 'coverage') return 'coverage';
  if (slug === 'playground' || slug.includes('api') || slug.includes('sdk') || slug === 'api-key') {
    return 'api';
  }
  if (family === 'VerbaAPI' || family === 'Resources') return 'api';
  if (family === 'VerbaAgents') return 'chat';
  return 'console';
}

function industryUseCases(product: ProductPage): ProductUseCase[] {
  const name = product.linkName;
  const verticalDefaults: Record<string, ProductUseCase[]> = {
    telecommunications: [
      {
        title: 'IVR that understands local speech',
        scenario: `A pan-African telco routes callers who speak Hausa, Swahili, or French into the right care path using ${name}.`,
        outcome: 'Lower abandon rates and fewer agent transfers when accents and code-switching appear.',
      },
      {
        title: 'Field tech voice notes',
        scenario: 'Technicians dictate tower checklists in mixed English + local language after site visits.',
        outcome: 'Structured tickets land in the NOC without typing on dusty handsets.',
      },
      {
        title: 'Churn save campaigns',
        scenario: 'Outbound voice agents explain data bundles in the customer’s preferred language.',
        outcome: 'Higher save rates with culturally natural scripts, not robotic English-only prompts.',
      },
    ],
    'financial-services': [
      {
        title: 'Voice KYC and collections',
        scenario: `Banks run consented voice flows with ${name} for onboarding and soft collections across markets.`,
        outcome: 'Compliant conversations customers actually finish — in Yoruba, Zulu, Arabic, or English.',
      },
      {
        title: 'Branch + app hybrid support',
        scenario: 'App chat escalates to a voice agent that already knows the customer’s language preference.',
        outcome: 'Fewer branch visits for routine balance and dispute questions.',
      },
      {
        title: 'Internal ops briefings',
        scenario: 'Risk teams generate spoken summaries of fraud alerts for field investigators.',
        outcome: 'Faster handoffs when investigators are offline or on the move.',
      },
    ],
    healthcare: [
      {
        title: 'Clinic triage lines',
        scenario: `Patients describe symptoms in their home language; ${name} powers transcription and agent guidance.`,
        outcome: 'Nurses start with structured notes instead of re-asking basic history.',
      },
      {
        title: 'Medication reminders',
        scenario: 'TTS reminders go out in Amharic, Swahili, or French after pharmacy pickup.',
        outcome: 'Higher adherence without requiring literacy in English SMS.',
      },
      {
        title: 'Community health worker tools',
        scenario: 'CHWs record household visits and get translated summaries for supervisors.',
        outcome: 'Better coverage reporting across language boundaries.',
      },
    ],
    government: [
      {
        title: 'Citizen helplines',
        scenario: `Ministries answer tax, licensing, and benefits questions with ${name} in national + local languages.`,
        outcome: 'Equitable access for citizens who never open a web portal.',
      },
      {
        title: 'Public broadcast localization',
        scenario: 'Emergency alerts are dubbed and spoken across regional languages within minutes.',
        outcome: 'Clear guidance reaches radio, IVR, and WhatsApp-style channels together.',
      },
      {
        title: 'Civic education content',
        scenario: 'Policy explainers become voice lessons for rural and diaspora audiences.',
        outcome: 'Higher comprehension than English PDF notices alone.',
      },
    ],
    education: [
      {
        title: 'Mother-tongue tutoring',
        scenario: `Students practice lessons with ${name} speaking and listening in their classroom language.`,
        outcome: 'Concepts stick when instruction matches how learners already think.',
      },
      {
        title: 'Teacher content production',
        scenario: 'Educators generate voiceovers for slides without a recording booth.',
        outcome: 'Faster course updates across multiple language tracks.',
      },
      {
        title: 'Exam accessibility',
        scenario: 'Oral assessments are transcribed for graders with dialect-aware STT.',
        outcome: 'Fairer scoring when accents would otherwise confuse generic models.',
      },
    ],
    'retail-ecommerce': [
      {
        title: 'Shopper support voice bots',
        scenario: `Marketplaces handle order status in local languages with ${name}.`,
        outcome: 'Fewer tickets stuck waiting for English-speaking agents.',
      },
      {
        title: 'Localized product videos',
        scenario: 'Merchants dub catalog clips into regional languages for social commerce.',
        outcome: 'Higher conversion in markets where English ads underperform.',
      },
      {
        title: 'Seller onboarding',
        scenario: 'Voice agents walk new sellers through KYC and listing steps.',
        outcome: 'More completed onboarding outside major metro English speakers.',
      },
    ],
    'travel-hospitality': [
      {
        title: 'Airport and hotel concierge',
        scenario: `Travelers ask for directions and bookings in French, Arabic, or Swahili via ${name}.`,
        outcome: 'Guest satisfaction rises when staff language coverage is thin.',
      },
      {
        title: 'Tour narration',
        scenario: 'Operators generate multilingual audio guides from one script.',
        outcome: 'One content desk serves many source markets.',
      },
      {
        title: 'Booking recovery calls',
        scenario: 'Voice agents confirm reservations and upsell experiences in the guest’s language.',
        outcome: 'Fewer no-shows and clearer itinerary understanding.',
      },
    ],
    'customer-support': [
      {
        title: 'Tier-1 voice deflection',
        scenario: `${name} answers FAQs and collects intent before a human joins.`,
        outcome: 'Agents spend time on exceptions, not password resets in five languages.',
      },
      {
        title: 'QA from real calls',
        scenario: 'Support calls are transcribed for coaching with accent-aware STT.',
        outcome: 'Managers coach on substance, not misheard transcripts.',
      },
      {
        title: 'Omnichannel handoff',
        scenario: 'Chat, WhatsApp-style text, and voice share the same language intelligence.',
        outcome: 'Customers do not repeat themselves when channels change.',
      },
    ],
  };

  if (verticalDefaults[product.slug]) return verticalDefaults[product.slug];

  return [
    {
      title: `${product.audiences[0] ?? 'Teams'} ship faster`,
      scenario: `${product.audiences[0] ?? 'Product teams'} use ${name} to ${product.lede.replace(/\.$/, '').toLowerCase()}.`,
      outcome: product.features[0]
        ? `They get ${product.features[0].toLowerCase()} without stitching five vendors.`
        : 'They launch with one African-first stack instead of generic global AI bolted on.',
    },
    {
      title: 'Multilingual customer moments',
      scenario: `A live journey mixes English with local language; ${name} stays coherent through code-switching.`,
      outcome: 'Trust stays high because the experience sounds like the market, not a translation afterthought.',
    },
    {
      title: 'Operate with proof',
      scenario: `Operators review outputs in the VerbaLab console (${product.consoleHref}) before scaling spend.`,
      outcome: 'Buyers see quality on their own content — then wire the same capability into production APIs.',
    },
  ];
}

function sampleCodeFor(product: ProductPage, kind: ProductDemoKind): string {
  switch (kind) {
    case 'tts':
      return `import { VerbaLab } from "@verbalab/sdk";

const client = new VerbaLab({ apiKey: process.env.VERBALAB_API_KEY });

const audio = await client.audio.speech({
  voice: "own:sw-aisha",
  text: "Karibu — VerbaLab speaks with you.",
  format: "mp3",
});`;
    case 'stt':
      return `const form = new FormData();
form.append("file", audioBlob, "call.webm");

const res = await fetch("https://api.verbalab.ai/v1/audio/transcriptions", {
  method: "POST",
  headers: { Authorization: \`Bearer \${process.env.VERBALAB_API_KEY}\` },
  body: form,
});
const { text, language } = await res.json();`;
    case 'translate':
      return `await client.translate({
  text: "Goods leave Lagos for Accra tomorrow.",
  source: "en",
  target: "sw",
});`;
    case 'chat':
      return `await client.chat.completions({
  messages: [
    { role: "user", content: "Ele kaaso mi ni Yoruba ki o si tumo si English." },
  ],
  translateReplyTo: "en",
});`;
    case 'detect':
      return `await client.detect({ text: "Sannu da zuwa, ina son taimako." });`;
    default:
      return `curl -H "Authorization: Bearer $VERBALAB_API_KEY" \\
  "${product.consoleHref.startsWith('/') ? 'https://api.verbalab.ai' : ''}/v1/..." \\
  # See Docs / OpenAPI for ${product.linkName}`;
  }
}

const OVERVIEW_OVERRIDES: Partial<Record<string, string>> = {
  'text-to-speech':
    'VerbaLab Text to Speech turns scripts into natural African speech — not generic global voices with a thin accent layer. It is built for ads, IVR, learning, and storytelling where Yoruba, Swahili, Zulu, Hausa, Amharic, Arabic, French, and English often share the same sentence. Teams iterate in Voice Studio, then ship the same voices through the TTS API so creative and product stay aligned.',
  'speech-to-text':
    'VerbaLab Speech to Text hears accents, dialects, and code-switching that break imported STT stacks. Use it for contact-center QA, media captioning, clinic notes, and agent loops where missing a local word means missing the customer. Review in the Speech hub, then automate with the STT API.',
  'conversational-ai':
    'Conversational AI on VerbaLab is the African Voice LLM experience: customers type or speak, the platform understands multilingual intent, and Jarvis-style speak-back replies in a useful language. It is the front door for support, sales, and internal ops that must feel culturally fluent — not like a chatbot translated after the fact.',
  'voice-agents':
    'Voice Agents combine STT, reasoning, and TTS into phone- and app-ready conversations for African markets. Deploy playbooks for telco, finance, public services, and retail with guardrails and observability so agents stay on-policy while sounding human.',
  'translate-api':
    'VerbaTranslate moves meaning across African and global languages for trade, product UI, and conversations. Pair it with detect and chat so your apps never guess the wrong language — and so operators can prove quality on real market copy before go-live.',
  coverage:
    'Coverage is where buyers verify honesty: which languages, countries, and modalities VerbaLab supports today. Use it in RFPs and technical evaluations so expansion plans stay grounded in shipped inventory, not slideware.',
  playground:
    'The Playground lets evaluators exercise translate, detect, and languages with their own keys before writing integration code. It is the shortest path from “interesting” to “this works on our copy.”',
};

function overviewFor(product: ProductPage): string {
  if (OVERVIEW_OVERRIDES[product.slug]) return OVERVIEW_OVERRIDES[product.slug]!;
  return [
    `${product.title} is part of VerbaLab’s ${product.family} surface — built so African languages, accents, and markets are first-class, not an afterthought.`,
    product.description,
    `Teams typically evaluate in the console (${product.consoleHref}), prove quality on their own content, then scale through APIs, SDKs, and agents.`,
    `It serves ${product.audiences.join(', ').toLowerCase()} who need ${product.features.slice(0, 2).join(' and ').toLowerCase()}.`,
  ].join(' ');
}

function howItWorksFor(product: ProductPage, kind: ProductDemoKind): string[] {
  const byKind: Record<ProductDemoKind, string[]> = {
    tts: [
      'Write or paste the script (mixed-language allowed).',
      'Pick a voice / persona tuned for the market.',
      'Render speech in Studio or via API and preview instantly.',
      'Export or stream into ads, IVR, apps, or agents.',
    ],
    stt: [
      'Capture microphone audio or upload a call/file.',
      'VerbaLab transcribes with accent and dialect awareness.',
      'Review text, language, and confidence in Speech tools.',
      'Feed transcripts into agents, analytics, or archives.',
    ],
    translate: [
      'Provide source text from product, chat, or trade docs.',
      'Choose source/target (or detect automatically).',
      'Receive culturally grounded translation via API or console.',
      'Reuse the same path in agents and content pipelines.',
    ],
    detect: [
      'Submit a text sample from a customer or document.',
      'VerbaLab returns language signals for routing.',
      'Use the result to pick TTS voice, MT pair, or agent policy.',
      'Log detections for analytics and coverage planning.',
    ],
    chat: [
      'Open African Voice LLM chat or call the chat API.',
      'User types or speaks in any supported language.',
      'VerbaLab understands, optionally translates, and answers.',
      'Enable Jarvis speak-back so replies are heard, not only read.',
    ],
    languages: [
      'Query the languages inventory from coverage or API.',
      'Filter by market, script, or product modality.',
      'Confirm support before promising a launch market.',
      'Subscribe to expansion as new locales ship.',
    ],
    voices: [
      'Browse stock and own voices for the target language.',
      'Preview lines that match your brand tone.',
      'Lock a voice into Studio projects or agent configs.',
      'Scale the same voice ID through the TTS API.',
    ],
    coverage: [
      'Open the public coverage pages.',
      'Inspect language and country inventories.',
      'Cross-check against your launch list.',
      'Plan phased rollouts where support is still expanding.',
    ],
    api: [
      'Create a vl_test_ or vl_live_ API key.',
      'Call the endpoint shown in Docs / OpenAPI.',
      'Validate on sample African content in Playground.',
      'Wire SDKs (TypeScript, iOS, Android) into your product.',
    ],
    console: [
      `Open ${product.linkName} in the VerbaLab console.`,
      'Run a guided sample on content from your market.',
      'Inspect outputs, logs, and configuration.',
      'Promote the same workflow to API or agent automation.',
    ],
  };
  return byKind[kind];
}

function samplePromptFor(product: ProductPage, kind: ProductDemoKind): string {
  switch (kind) {
    case 'tts':
      return 'Karibu to VerbaLab — Africa owns this voice. Welcome to a platform that hears you.';
    case 'stt':
      return 'Speak a short line in any African language (or English) — we will transcribe it live.';
    case 'translate':
      return 'Goods leave Lagos for Accra tomorrow. Please confirm the delivery window.';
    case 'chat':
      return 'Habari — introduce VerbaLab in one friendly sentence, then offer help in Swahili.';
    case 'detect':
      return 'Sannu da zuwa, ina son taimako da odarina.';
    default:
      return product.lede;
  }
}

/** Rich narrative + demo config for every dedicated product lander. */
export function getProductStory(product: ProductPage): ProductStory {
  const demoKind = demoForSlug(product.slug, product.family);
  const demoTitles: Record<ProductDemoKind, string> = {
    tts: 'Live speech demo',
    stt: 'Live transcription demo',
    translate: 'Live translation demo',
    detect: 'Live language detect',
    chat: 'Live African Voice LLM',
    languages: 'Live language inventory',
    voices: 'Live voice catalog',
    coverage: 'Live coverage snapshot',
    api: 'Live API sandbox',
    console: 'Live capability preview',
  };
  const demoBlurbs: Record<ProductDemoKind, string> = {
    tts: 'Type a line, pick a voice, and hear VerbaLab speak — the same path your product will call.',
    stt: 'Record a few seconds and watch African-aware transcription appear in realtime.',
    translate: 'Translate market copy between languages and inspect the live JSON response.',
    detect: 'Paste customer text and see language detection fire instantly.',
    chat: 'Ask anything — text in, optional voice out — powered by the African Voice LLM.',
    languages: 'Pull the live languages list VerbaLab exposes to every workspace.',
    voices: 'Load real voice IDs available for TTS and agents right now.',
    coverage: 'See live language counts that buyers can trust in evaluations.',
    api: 'Run a real authenticated call (session or API key) and read the response.',
    console: 'Preview the capability path, then jump into the working console.',
  };

  return {
    overview: overviewFor(product),
    howItWorks: howItWorksFor(product, demoKind),
    useCases: industryUseCases(product),
    demoKind,
    demoTitle: demoTitles[demoKind],
    demoBlurb: demoBlurbs[demoKind],
    samplePrompt: samplePromptFor(product, demoKind),
    sampleCode: sampleCodeFor(product, demoKind),
    proofPoints: [
      ...product.features.slice(0, 3),
      `Console: ${product.consoleHref}`,
      `Built for ${product.audiences.slice(0, 2).join(' & ')}`,
    ],
  };
}
