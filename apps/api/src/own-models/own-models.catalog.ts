/**
 * VerbaLab Own Models — sharp profiles, cost tiers, and routing rules.
 * Use the right family for the job; never burn Reason FM credits on STT.
 */
import { CREDIT_RATES, type CreditProduct } from '../billing/credits';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { HERO_WEIGHT_LANGUAGES } from '../model-runtime/weights-deploy';

export type CostTier = 'frugal' | 'standard' | 'premium' | 'pack';
export type Sharpness = 'specialist' | 'generalist' | 'pipeline' | 'runtime';

export type OwnModelFamily = {
  id: string;
  title: string;
  modality: string;
  blurb: string;
  sharpness: Sharpness;
  /** Lower = cheaper default path */
  costTier: CostTier;
  creditProduct?: CreditProduct;
  /** When to pick this family */
  useWhen: string[];
  /** When to avoid / prefer a sibling */
  avoidWhen: string[];
  /** Cheaper or sharper alternatives */
  siblings: Array<{ id: string; relation: 'cheaper' | 'sharper' | 'pipeline' | 'runtime' }>;
  heroLanguages: string[];
  skus: string[];
  consolePath: string;
  apiBase: string;
  try: {
    kind: 'chat' | 'stt' | 'tts' | 'mt' | 'ocr' | 'embed' | 'stream' | 'dub' | 'route' | 'probe';
    href: string;
    label: string;
  };
  missing: Array<{ id: string; gap: string; fix: string; status: 'open' | 'shipped' }>;
  marketingLine: string;
  endpointEnv: Record<string, string>;
};

const heroes = [...HERO_WEIGHT_LANGUAGES];

export function ownModelsHonesty() {
  return {
    product: 'own-models',
    ownedModels: true,
    vendorRentalDefault: false,
    shipsTrainedCompetitiveWeightsInRepo: false,
    sotaClaimsRequireEvalEvidence: true,
    note:
      'Own Models are VerbaLab-owned specialists. Route by modality + budget — Baobab for African chat, Echo for STT, Voice FM for TTS, Translate FM for MT. Never rent a frontier LLM for a job a specialist owns.',
  };
}

export function ownModelFamilies(): OwnModelFamily[] {
  return [
    {
      id: 'baobab',
      title: 'Baobab',
      modality: 'chat',
      blurb: 'African language specialist LLM — cultural fluency without frontier token burn.',
      sharpness: 'specialist',
      costTier: 'standard',
      creditProduct: 'chat',
      useWhen: [
        'African-language chat / assistants',
        'Dialect-aware Q&A',
        'Default Atlas / African Voice LLM path',
      ],
      avoidWhen: ['Pure STT/TTS (use Echo / Voice FM)', 'Deep multi-step math (prefer Reason FM)'],
      siblings: [
        { id: 'reason-fm', relation: 'sharper' },
        { id: 'edge', relation: 'cheaper' },
        { id: 'atlas', relation: 'pipeline' },
      ],
      heroLanguages: heroes,
      skus: ['vl-atlas-chat-v1'],
      consolePath: '/baobab',
      apiBase: '/v1/baobab',
      try: { kind: 'chat', href: '/african-voice', label: 'Try African Voice chat' },
      missing: [
        { id: 'lora-sw', gap: 'Hero-language LoRA checkpoints', fix: 'Model Release gate → weights deploy', status: 'open' },
        { id: 'quality-card', gap: 'Public African chat quality card', fix: 'african-quality-eval + native panel', status: 'open' },
      ],
      marketingLine: 'Best-effort African chat on Africa-hosted infra — not “we beat Claude.”',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_CHAT_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'echo',
      title: 'Echo',
      modality: 'stt',
      blurb: 'Speech recognition FM — African dialects, telephony-aware, batch-first cost.',
      sharpness: 'specialist',
      costTier: 'standard',
      creditProduct: 'stt',
      useWhen: ['Transcription', 'Meeting notes', 'STT before translate / chat'],
      avoidWhen: ['Realtime-only needs without budget (use stt_realtime sparingly)', 'TTS (Voice FM)'],
      siblings: [
        { id: 'speech-depth', relation: 'pipeline' },
        { id: 'edge', relation: 'cheaper' },
      ],
      heroLanguages: heroes,
      skus: ['vl-stt-sw-v1', 'vl-stt-yo-v1', 'vl-stt-ha-v1', 'vl-stt-am-v1', 'vl-stt-zu-v1'],
      consolePath: '/echo',
      apiBase: '/v1/echo',
      try: { kind: 'stt', href: '/speech', label: 'Try Speech / STT' },
      missing: [
        { id: 'wer', gap: 'Labeled WER cards per hero language', fix: 'Eval farm + Model Release gate', status: 'open' },
        { id: 'telephony', gap: '8kHz / AMR fine-tune pack', fix: 'Tier B speech train', status: 'open' },
      ],
      marketingLine: 'Best Swahili / Yoruba / Hausa STT path — batch meters by default.',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_STT_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'voice-fm',
      title: 'Voice FM',
      modality: 'tts',
      blurb: 'Neural TTS + cloning FM — flash path for cost, multilingual for quality.',
      sharpness: 'specialist',
      costTier: 'standard',
      creditProduct: 'tts',
      useWhen: ['Speech synthesis', 'Voice cloning with consent', 'IVR / assistant speak'],
      avoidWhen: ['Cheap drafts when flash quality is enough — prefer tts_flash rate'],
      siblings: [
        { id: 'video-voice', relation: 'pipeline' },
        { id: 'edge', relation: 'cheaper' },
      ],
      heroLanguages: heroes,
      skus: ['vl-tts-sw-v1', 'vl-tts-yo-v1', 'vl-tts-ha-v1', 'vl-tts-am-v1', 'vl-tts-zu-v1'],
      consolePath: '/voice-fm',
      apiBase: '/v1/voice-fm',
      try: { kind: 'tts', href: '/voice', label: 'Try Voice / TTS' },
      missing: [
        { id: 'mos', gap: 'Native-panel MOS cards', fix: 'Listening panels before GA', status: 'open' },
        { id: 'watermark', gap: 'Default watermark on all clones', fix: 'Voice passport + seal path', status: 'shipped' },
      ],
      marketingLine: 'Natural African TTS — flash rate for drafts, full for production.',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_TTS_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'vision-fm',
      title: 'Vision FM',
      modality: 'ocr',
      blurb: 'Document / OCR vision FM — pages, not chat tokens.',
      sharpness: 'specialist',
      costTier: 'standard',
      creditProduct: 'ocr',
      useWhen: ['OCR', 'Scanned forms / IDs', 'Document text extract before MT'],
      avoidWhen: ['Pure language chat (Baobab)', 'Image generation (not this product)'],
      siblings: [{ id: 'fusion', relation: 'sharper' }],
      heroLanguages: heroes,
      skus: ['vl-ocr-af-v1'],
      consolePath: '/vision-fm',
      apiBase: '/v1/vision-fm',
      try: { kind: 'ocr', href: '/playground', label: 'Try OCR in playground' },
      missing: [
        { id: 'sku', gap: 'Versioned vl-ocr-* SKU in Model Release', fix: 'Add OCR SKU + gate', status: 'shipped' },
        { id: 'africa-scripts', gap: 'Ajami / Ethiopic OCR suites', fix: 'Labeled page packs', status: 'open' },
      ],
      marketingLine: 'OCR for African documents — meter by page, not tokens.',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_OCR_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'vector-fm',
      title: 'Vector FM',
      modality: 'embed',
      blurb: 'Embeddings FM — cheapest retrieval path for African text.',
      sharpness: 'specialist',
      costTier: 'frugal',
      creditProduct: 'embeddings',
      useWhen: ['RAG', 'Semantic search', 'Clustering / similarity'],
      avoidWhen: ['Generation tasks (use Baobab / Translate FM)'],
      siblings: [{ id: 'baobab', relation: 'sharper' }],
      heroLanguages: heroes,
      skus: ['vl-embed-af-v1'],
      consolePath: '/vector-fm',
      apiBase: '/v1/vector-fm',
      try: { kind: 'embed', href: '/playground', label: 'Try embeddings' },
      missing: [
        { id: 'sku', gap: 'vl-embed-af-v1 SKU', fix: 'Model Release seed + eval', status: 'shipped' },
      ],
      marketingLine: 'Frugal African embeddings — 1 credit per 1k tokens.',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_EMBED_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'reason-fm',
      title: 'Reason FM',
      modality: 'chat',
      blurb: 'Reasoning specialist — use only when Baobab is not enough.',
      sharpness: 'specialist',
      costTier: 'premium',
      creditProduct: 'chat',
      useWhen: ['Multi-step reasoning', 'Policy / compliance analysis', 'Hard instruction following'],
      avoidWhen: ['Casual chat (Baobab)', 'STT/TTS/MT (specialists)'],
      siblings: [
        { id: 'baobab', relation: 'cheaper' },
        { id: 'fusion', relation: 'pipeline' },
      ],
      heroLanguages: heroes,
      skus: [],
      consolePath: '/reason-fm',
      apiBase: '/v1/reason-fm',
      try: { kind: 'chat', href: '/african-voice', label: 'Route via Reason when needed' },
      missing: [
        { id: 'router', gap: 'Auto escalate Baobab → Reason on hard tasks', fix: 'own-models route API', status: 'shipped' },
      ],
      marketingLine: 'Premium reasoning — escalate, do not default.',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_CHAT_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'edge',
      title: 'Edge',
      modality: 'edge',
      blurb: 'On-device / offline packs — zero cloud burn after install.',
      sharpness: 'runtime',
      costTier: 'pack',
      useWhen: ['Offline clinics / borders', 'Residency islands', 'Cost ceiling = pack once'],
      avoidWhen: ['Need latest cloud weights without sync'],
      siblings: [
        { id: 'echo', relation: 'sharper' },
        { id: 'voice-fm', relation: 'sharper' },
      ],
      heroLanguages: heroes,
      skus: [],
      consolePath: '/edge',
      apiBase: '/v1/edge',
      try: { kind: 'probe', href: '/edge-offline', label: 'Edge offline packs' },
      missing: [
        { id: 'pack-builder', gap: 'One-click Echo+Voice FM island pack', fix: 'edge-offline builder UI', status: 'open' },
      ],
      marketingLine: 'Pay once in compute, run offline — sovereignty first.',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_EDGE_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'fusion',
      title: 'Fusion',
      modality: 'multimodal',
      blurb: 'Multimodal fusion — orchestrates specialists instead of one giant model.',
      sharpness: 'pipeline',
      costTier: 'premium',
      useWhen: ['Audio + text + image in one workflow', 'Agent tools that need multiple FMs'],
      avoidWhen: ['Single-modality jobs (route to Echo/Voice/Vision/Baobab directly)'],
      siblings: [
        { id: 'baobab', relation: 'cheaper' },
        { id: 'vision-fm', relation: 'cheaper' },
      ],
      heroLanguages: heroes,
      skus: [],
      consolePath: '/fusion',
      apiBase: '/v1/fusion',
      try: { kind: 'route', href: '/own-models', label: 'Route multimodal jobs' },
      missing: [
        { id: 'orchestrator', gap: 'Declarative Fusion graph runner', fix: 'Workflow runtime bind', status: 'open' },
      ],
      marketingLine: 'Compose specialists — cheaper and sharper than one blob model.',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_FUSION_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'translate-fm',
      title: 'Translate FM',
      modality: 'mt',
      blurb: 'African MT foundation — glossary + TM beat generic LLM translate.',
      sharpness: 'specialist',
      costTier: 'frugal',
      creditProduct: 'translate',
      useWhen: ['en↔African language translate', 'Domain packs / glossary', 'Dubbing MT step'],
      avoidWhen: ['Using Baobab/Reason as a translator (more expensive, less consistent)'],
      siblings: [
        { id: 'video-voice', relation: 'pipeline' },
        { id: 'baobab', relation: 'sharper' },
      ],
      heroLanguages: heroes,
      skus: ['vl-mt-af-v1'],
      consolePath: '/translate-fm',
      apiBase: '/v1/translate-fm',
      try: { kind: 'mt', href: '/translate', label: 'Try Translate' },
      missing: [
        { id: 'ga', gap: 'GA only after african-quality-eval', fix: 'Model Release promote gate', status: 'shipped' },
      ],
      marketingLine: 'Af–En / dialect MT on Africa residency — character meters.',
      endpointEnv: {
        base: 'VERBALAB_MODEL_BASE_URL',
        modality: 'VERBALAB_MT_URL',
        apiKey: 'VERBALAB_MODEL_API_KEY',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'model-runtime',
      title: 'Model Runtime',
      modality: 'runtime',
      blurb: 'Local / weights runtime — fixtures, probes, hero-language deploys.',
      sharpness: 'runtime',
      costTier: 'pack',
      useWhen: ['Dev / CI fixtures', 'Weights probe', 'Island runtime'],
      avoidWhen: ['Production customer traffic without configured endpoints'],
      siblings: [{ id: 'model-release', relation: 'pipeline' }],
      heroLanguages: heroes,
      skus: [],
      consolePath: '/model-runtime',
      apiBase: '/v1/model-runtime',
      try: { kind: 'probe', href: '/model-release', label: 'Model Release + weights' },
      missing: [],
      marketingLine: 'Runtime honesty — fixtures local, weights optional.',
      endpointEnv: {
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
        local: 'VERBALAB_LOCAL_MODEL_RUNTIME',
        weights: 'VERBALAB_WEIGHTS_URL',
      },
    },
    {
      id: 'speech-depth',
      title: 'Speech Depth',
      modality: 'stt-stream',
      blurb: 'Streaming STT + dialect hints on Echo — realtime premium when needed.',
      sharpness: 'pipeline',
      costTier: 'premium',
      creditProduct: 'stt_realtime',
      useWhen: ['Live captions', 'Call center streams', 'Dialect-tagged sessions'],
      avoidWhen: ['Batch files (use Echo batch — cheaper)'],
      siblings: [
        { id: 'echo', relation: 'cheaper' },
        { id: 'call-intelligence', relation: 'pipeline' },
      ],
      heroLanguages: heroes,
      skus: ['vl-stt-sw-v1'],
      consolePath: '/speech-depth',
      apiBase: '/v1/speech-depth',
      try: { kind: 'stream', href: '/speech-depth', label: 'Start stream session' },
      missing: [
        { id: 'ws', gap: 'True websocket audio frames', fix: 'Upgrade stream transport', status: 'open' },
      ],
      marketingLine: 'Realtime only when live — otherwise Echo batch.',
      endpointEnv: {
        modality: 'VERBALAB_STT_URL',
        fixture: 'VERBALAB_OWN_AI_FIXTURE',
      },
    },
    {
      id: 'video-voice',
      title: 'Video Voice',
      modality: 'dubbing',
      blurb: 'Dubbing pipeline: Echo → Translate FM → Voice FM — billed as dubbing minutes.',
      sharpness: 'pipeline',
      costTier: 'premium',
      creditProduct: 'dubbing_auto_watermark',
      useWhen: ['Video / content dubbing', 'Watermarked free-tier exports'],
      avoidWhen: ['Plain TTS without video (Voice FM direct)'],
      siblings: [
        { id: 'voice-fm', relation: 'cheaper' },
        { id: 'translate-fm', relation: 'cheaper' },
      ],
      heroLanguages: heroes,
      skus: ['vl-mt-af-v1', 'vl-tts-sw-v1'],
      consolePath: '/video-voice',
      apiBase: '/v1/video-voice',
      try: { kind: 'dub', href: '/video-voice', label: 'Run a dub' },
      missing: [],
      marketingLine: 'Pipeline specialists — watermarked free, clean on Starter+.',
      endpointEnv: {
        stt: 'VERBALAB_STT_URL',
        mt: 'VERBALAB_MT_URL',
        tts: 'VERBALAB_TTS_URL',
      },
    },
    {
      id: 'ai-internet',
      title: 'AI Internet',
      modality: 'fabric',
      blurb: 'Discovery / routing fabric across VerbaLab surfaces — not a foundation LLM.',
      sharpness: 'pipeline',
      costTier: 'frugal',
      useWhen: ['Product discovery', 'Cross-surface routing', 'Audit of AI Internet readiness'],
      avoidWhen: ['Inference itself (use a specialist FM)'],
      siblings: [{ id: 'fusion', relation: 'pipeline' }],
      heroLanguages: heroes,
      skus: [],
      consolePath: '/ai-internet',
      apiBase: '/v1/ai-internet',
      try: { kind: 'route', href: '/ai-internet', label: 'Open AI Internet' },
      missing: [],
      marketingLine: 'Find the right VerbaLab surface — then call the specialist.',
      endpointEnv: {},
    },
  ];
}

export function getOwnModelFamily(id: string): OwnModelFamily | undefined {
  return ownModelFamilies().find((f) => f.id === id);
}

export function costCard(family: OwnModelFamily) {
  const rate = family.creditProduct ? CREDIT_RATES[family.creditProduct] : null;
  return {
    tier: family.costTier,
    product: family.creditProduct ?? null,
    rate,
    tip:
      family.costTier === 'premium'
        ? 'Escalate only when a cheaper specialist fails the job.'
        : family.costTier === 'frugal'
          ? 'Default here when quality is good enough — save premium for hard cases.'
          : family.costTier === 'pack'
            ? 'Pack / offline — minimize recurring cloud credits.'
            : 'Standard specialist meter — prefer over generalist chat for this modality.',
  };
}

export function ownModelsCatalog() {
  const families = ownModelFamilies();
  return {
    id: 'own-models',
    title: 'Own Models',
    blurb:
      'VerbaLab-owned specialists with cost-aware routing. Sharp on African speech/language; frugal by picking the right family.',
    honesty: ownModelsHonesty(),
    docs: '/docs/OWN_MODELS.md',
    familyCount: families.length,
    heroLanguages: heroes,
    ownAi: ownAiStackSummary(),
    related: {
      modelRelease: '/model-release',
      foundationModelCloud: '/foundation-model-cloud',
      gateway: '/gateway',
      usage: '/usage',
      gpu: '/gpu-platform',
    },
  };
}

/** Merge development profile into a family engine() response. */
export function developOwnModelEngine(id: string, base: Record<string, unknown>) {
  const family = getOwnModelFamily(id);
  if (!family) return base;
  return {
    ...base,
    title: family.title,
    blurb: family.blurb,
    modality: family.modality,
    development: {
      sharpness: family.sharpness,
      cost: costCard(family),
      useWhen: family.useWhen,
      avoidWhen: family.avoidWhen,
      siblings: family.siblings,
      skus: family.skus,
      missing: family.missing,
      marketingLine: family.marketingLine,
      try: family.try,
      heroLanguages: family.heroLanguages,
    },
  };
}
