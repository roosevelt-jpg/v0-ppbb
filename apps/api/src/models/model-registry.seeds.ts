/** Gateway features tracked in the model registry (VL-110). */
export const MODEL_FEATURES = [
  'translate',
  'stt',
  'tts',
  'ocr',
  'detect',
  'chat',
  'embeddings',
] as const;

export type ModelFeature = (typeof MODEL_FEATURES)[number];

export type ModelKind = 'vendor' | 'finetune' | 'http';

export type VendorDefaultSeed = {
  slug: string;
  feature: ModelFeature;
  provider: string;
  displayName: string;
  baseModel: string;
  notes: string;
  /** Env var that must be set for this provider to be callable (empty = always available). */
  envKey: string | null;
  /** Secondary ready entry (e.g. detect fallback). */
  role?: 'primary' | 'fallback';
};

/**
 * VerbaLab-owned model defaults (ADR-0298). Legacy vendor seeds remain as optional fallback.
 * Optional externalUrl (W&B, docs) is set later by platform admins.
 */
export const VENDOR_MODEL_SEEDS: VendorDefaultSeed[] = [
  {
    slug: 'verbalab-translate-fm',
    feature: 'translate',
    provider: 'verbalab_own_ai',
    displayName: 'VerbaLab Translate FM',
    baseModel: 'translate-fm',
    notes: 'Primary MT — VerbaLab-owned African translation model (ADR-0298 / ).',
    envKey: 'VERBALAB_MT_URL',
    role: 'primary',
  },
  {
    slug: 'verbalab-echo-stt',
    feature: 'stt',
    provider: 'verbalab_own_ai',
    displayName: 'VerbaLab Echo',
    baseModel: 'echo',
    notes: 'Primary STT — VerbaLab-owned speech recognition.',
    envKey: 'VERBALAB_STT_URL',
    role: 'primary',
  },
  {
    slug: 'verbalab-voice-fm',
    feature: 'tts',
    provider: 'verbalab_own_ai',
    displayName: 'VerbaLab Voice FM',
    baseModel: 'voice-fm',
    notes: 'Primary TTS + cloning — ElevenLabs of Africa (/ ).',
    envKey: 'VERBALAB_TTS_URL',
    role: 'primary',
  },
  {
    slug: 'verbalab-atlas-chat',
    feature: 'chat',
    provider: 'verbalab_own_ai',
    displayName: 'VerbaLab Atlas',
    baseModel: 'atlas',
    notes: 'Primary chat/LLM — VerbaLab-owned Atlas family.',
    envKey: 'VERBALAB_CHAT_URL',
    role: 'primary',
  },
  {
    slug: 'verbalab-vector-fm',
    feature: 'embeddings',
    provider: 'verbalab_own_ai',
    displayName: 'VerbaLab Vector FM',
    baseModel: 'vector-fm',
    notes: 'Primary embeddings — VerbaLab Vector FM.',
    envKey: 'VERBALAB_EMBED_URL',
    role: 'primary',
  },
  {
    slug: 'verbalab-vision-fm',
    feature: 'ocr',
    provider: 'verbalab_own_ai',
    displayName: 'VerbaLab Vision FM',
    baseModel: 'vision-fm',
    notes: 'Primary OCR/vision — VerbaLab Vision FM.',
    envKey: 'VERBALAB_OCR_URL',
    role: 'primary',
  },
  {
    slug: 'vendor-translate-google',
    feature: 'translate',
    provider: 'google_translate',
    displayName: 'Google Cloud Translation (legacy)',
    baseModel: 'cloud-translation-v2',
    notes: 'Legacy fallback only when VERBALAB_ALLOW_VENDOR_FALLBACK=1.',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-stt-openai-whisper',
    feature: 'stt',
    provider: 'openai_whisper',
    displayName: 'OpenAI Whisper (legacy)',
    baseModel: 'whisper-1',
    notes: 'Legacy fallback only when VERBALAB_ALLOW_VENDOR_FALLBACK=1.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-tts-openai',
    feature: 'tts',
    provider: 'openai_tts',
    displayName: 'OpenAI TTS (legacy)',
    baseModel: 'tts-1',
    notes: 'Legacy fallback only when VERBALAB_ALLOW_VENDOR_FALLBACK=1.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'own-tts-rented',
    feature: 'tts',
    provider: 'own_tts',
    displayName: 'Own TTS (VerbaLab Voice FM alias)',
    baseModel: 'voice-fm',
    notes: ': African voice catalog (own:*) via OWN_TTS_URL / VERBALAB_TTS_URL.',
    envKey: 'OWN_TTS_URL',
    role: 'fallback',
  },
  {
    slug: 'vendor-tts-elevenlabs-clone',
    feature: 'tts',
    provider: 'elevenlabs',
    displayName: 'ElevenLabs voice cloning (legacy)',
    baseModel: 'eleven_multilingual_v2',
    notes: 'Optional cloned voices. Consent + abuse review required; watermark always on.',
    envKey: 'ELEVENLABS_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-ocr-google-vision',
    feature: 'ocr',
    provider: 'google_vision',
    displayName: 'Google Cloud Vision OCR (legacy)',
    baseModel: 'vision-ocr',
    notes: 'Legacy fallback only when VERBALAB_ALLOW_VENDOR_FALLBACK=1.',
    envKey: 'GOOGLE_VISION_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'verbalab-detect',
    feature: 'detect',
    provider: 'verbalab_own_ai',
    displayName: 'VerbaLab language detection',
    baseModel: 'detect',
    notes: 'Primary detect on VerbaLab Own AI (heuristic fixture / DETECT_URL).',
    envKey: 'VERBALAB_MODEL_BASE_URL',
    role: 'primary',
  },
  {
    slug: 'vendor-detect-google',
    feature: 'detect',
    provider: 'google_detect',
    displayName: 'Google language detection (legacy)',
    baseModel: 'cloud-translation-detect',
    notes: 'Legacy fallback only when VERBALAB_ALLOW_VENDOR_FALLBACK=1.',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-detect-franc',
    feature: 'detect',
    provider: 'franc',
    displayName: 'franc (offline fallback)',
    baseModel: 'franc',
    notes: 'Always available offline fallback for detect.',
    envKey: null,
    role: 'fallback',
  },
  {
    slug: 'vendor-chat-openai',
    feature: 'chat',
    provider: 'openai_chat',
    displayName: 'OpenAI Chat Completions (legacy)',
    baseModel: 'gpt-4o-mini',
    notes: 'Legacy fallback only when VERBALAB_ALLOW_VENDOR_FALLBACK=1.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-chat-openrouter',
    feature: 'chat',
    provider: 'openrouter_chat',
    displayName: 'OpenRouter (legacy fallback)',
    baseModel: 'openai/gpt-4o-mini',
    notes: 'Legacy optional chat fallback when vendor fallback enabled.',
    envKey: 'OPENROUTER_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-embeddings-openai',
    feature: 'embeddings',
    provider: 'openai_embeddings',
    displayName: 'OpenAI Embeddings (legacy)',
    baseModel: 'text-embedding-3-small',
    notes: 'Legacy fallback only when VERBALAB_ALLOW_VENDOR_FALLBACK=1.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
];

export function envConfigured(envKey: string | null): boolean {
  if (!envKey) return true;
  if (process.env.VERBALAB_OWN_AI_FIXTURE === '1') {
    if (envKey.startsWith('VERBALAB_') || envKey === 'OWN_TTS_URL') return true;
  }
  if (envKey === 'GOOGLE_VISION_API_KEY') {
    return Boolean(process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY);
  }
  if (envKey.startsWith('VERBALAB_') && envKey.endsWith('_URL')) {
    return Boolean(process.env[envKey] || process.env.VERBALAB_MODEL_BASE_URL);
  }
  if (envKey === 'VERBALAB_MODEL_BASE_URL') {
    return Boolean(process.env.VERBALAB_MODEL_BASE_URL || process.env.VERBALAB_OWN_AI_FIXTURE === '1');
  }
  return Boolean(process.env[envKey]);
}

export function isModelFeature(value: string): value is ModelFeature {
  return (MODEL_FEATURES as readonly string[]).includes(value);
}
