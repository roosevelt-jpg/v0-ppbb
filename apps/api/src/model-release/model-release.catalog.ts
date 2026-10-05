import { HERO_WEIGHT_LANGUAGES } from '../model-runtime/weights-deploy';

export type ReleaseStage = 'data' | 'train' | 'eval' | 'serve' | 'announce' | 'ga' | 'rolled_back';

export type ModelSku = {
  id: string;
  family: 'stt' | 'tts' | 'mt' | 'chat' | 'voice-auth' | 'ocr' | 'embed';
  language: string | 'multi';
  version: string;
  displayName: string;
  status: 'draft' | 'eval' | 'canary' | 'ga' | 'deprecated';
  qualityCard: {
    suite: string;
    metrics: Record<string, number | string | null>;
    honesty: string;
    lastEvalAt: string | null;
  };
  marketingLine: string;
};

export function modelReleaseHonesty() {
  return {
    product: 'model-release',
    shipped: true,
    frontierPretrainClaimed: false,
    sotaClaimsForbidden: true,
    note:
      'VerbaLab ships versioned African-focus SKUs with quality cards and GA gates — not weekly GPT clones. Eval is African linguistic / speech authenticity, not MMLU.',
  };
}

export function modelReleaseCatalog() {
  return {
    id: 'model-release',
    title: 'Model Release Pipeline',
    blurb:
      'Data → Train → Eval → Serve → Announce for VerbaLab-owned African STT/TTS/MT/chat and Voice Law authenticity SKUs, with GPU budget ceilings and usage-driven priority.',
    honesty: modelReleaseHonesty(),
    docs: '/docs/MODEL_RELEASE.md',
    stages: ['data', 'train', 'eval', 'serve', 'announce', 'ga'] as ReleaseStage[],
    heroLanguages: [...HERO_WEIGHT_LANGUAGES],
    related: {
      weights: '/v1/model-runtime/weights',
      registry: '/model-registry',
      training: '/training-pipeline',
      gpu: '/gpu-platform',
      usage: '/usage',
      voiceLaw: '/voice-law-authenticity',
    },
    infrastructureTiers: {
      A: {
        name: 'Ship now',
        inference: '2–8× L40S/A100',
        train: '1–4× A100/H100 LoRA',
        serve: 'vLLM / Faster-Whisper / Triton + Nest',
      },
      B: {
        name: 'Top-class speech/MT',
        train: '8–32× H100/H200',
        inference: 'Separate autoscaled fleet + dialect data ops',
      },
      C: {
        name: 'Optional domain foundation',
        note: '1–7B African LM + speech tower after Tier B pays off',
      },
    },
    capabilities: [
      { id: 'skus', name: 'List versioned SKUs + quality cards', status: 'shipped' as const, api: 'GET /v1/model-release/skus' },
      { id: 'priority', name: 'Usage → next-model priority', status: 'shipped' as const, api: 'GET /v1/model-release/priority' },
      { id: 'gate', name: 'Run African quality GA gate', status: 'shipped' as const, api: 'POST /v1/model-release/gate' },
      { id: 'releases', name: 'Create / list releases', status: 'shipped' as const, api: 'POST /v1/model-release/releases' },
      { id: 'promote', name: 'Promote release stage', status: 'shipped' as const, api: 'POST /v1/model-release/releases/{id}/promote' },
      { id: 'gpu', name: 'GPU budget snapshot', status: 'shipped' as const, api: 'GET /v1/model-release/gpu-budget' },
    ],
  };
}

/** Seed VerbaLab focus SKUs — versioned product models, not “a new GPT”. */
export function seedModelSkus(now = new Date().toISOString()): ModelSku[] {
  const heroes = ['sw', 'yo', 'ha', 'am', 'zu'] as const;
  const skus: ModelSku[] = [];
  for (const lang of heroes) {
    skus.push({
      id: `vl-stt-${lang}-v1`,
      family: 'stt',
      language: lang,
      version: 'v1',
      displayName: `VerbaLab Echo STT (${lang})`,
      status: 'eval',
      qualityCard: {
        suite: 'african-stt-smoke',
        metrics: { werProxy: null, samples: 0 },
        honesty: 'WER requires labeled African speech; card fills after eval farm runs.',
        lastEvalAt: null,
      },
      marketingLine: `Best-effort ${lang} speech recognition on Africa-hosted infra`,
    });
    skus.push({
      id: `vl-tts-${lang}-v1`,
      family: 'tts',
      language: lang,
      version: 'v1',
      displayName: `VerbaLab Voice FM TTS (${lang})`,
      status: 'eval',
      qualityCard: {
        suite: 'african-tts-smoke',
        metrics: { mosProxy: null, samples: 0 },
        honesty: 'Listening MOS needs native panels; not auto-GA.',
        lastEvalAt: null,
      },
      marketingLine: `Natural ${lang} TTS with consent + watermark path`,
    });
  }
  skus.push({
    id: 'vl-mt-af-v1',
    family: 'mt',
    language: 'multi',
    version: 'v1',
    displayName: 'VerbaLab Translate FM (Africa)',
    status: 'canary',
    qualityCard: {
      suite: 'african-linguistic-quality',
      metrics: { ownWinRate: null, pairs: heroes.length },
      honesty: 'GA requires african-quality-eval gate pass.',
      lastEvalAt: null,
    },
    marketingLine: 'Af–En / dialect-aware translate on Africa residency',
  });
  skus.push({
    id: 'vl-atlas-chat-v1',
    family: 'chat',
    language: 'multi',
    version: 'v1',
    displayName: 'VerbaLab Atlas (African Voice LLM)',
    status: 'canary',
    qualityCard: {
      suite: 'african-voice-chat-smoke',
      metrics: { fixtureOnly: 1 },
      honesty: 'Local fixture until VERBALAB_CHAT_URL / weights live.',
      lastEvalAt: now,
    },
    marketingLine: 'African Voice LLM — speak or type in your language',
  });
  skus.push({
    id: 'vl-ocr-af-v1',
    family: 'ocr',
    language: 'multi',
    version: 'v1',
    displayName: 'VerbaLab Vision FM OCR (Africa)',
    status: 'eval',
    qualityCard: {
      suite: 'african-ocr-smoke',
      metrics: { pages: 0 },
      honesty: 'OCR quality needs labeled African script pages before GA.',
      lastEvalAt: null,
    },
    marketingLine: 'Document OCR for African scripts — meter by page',
  });
  skus.push({
    id: 'vl-embed-af-v1',
    family: 'embed',
    language: 'multi',
    version: 'v1',
    displayName: 'VerbaLab Vector FM Embeddings (Africa)',
    status: 'eval',
    qualityCard: {
      suite: 'african-embed-smoke',
      metrics: { dims: null },
      honesty: 'Retrieval quality needs African parallel query suites.',
      lastEvalAt: null,
    },
    marketingLine: 'Frugal African embeddings — RAG without frontier token burn',
  });
  skus.push({
    id: 'vl-law-voice-auth-v1',
    family: 'voice-auth',
    language: 'multi',
    version: 'v1',
    displayName: 'VerbaLab Voice Law Authenticity',
    status: 'ga',
    qualityCard: {
      suite: 'voice-authenticity-assist',
      metrics: { courtSoleEvidence: 0, certifiedPad: 0 },
      honesty: 'Assistive forensic screen only — not NIST PAD / sole courtroom proof.',
      lastEvalAt: now,
    },
    marketingLine: 'Investigative authenticity screen + provenance for legal teams',
  });
  return skus;
}