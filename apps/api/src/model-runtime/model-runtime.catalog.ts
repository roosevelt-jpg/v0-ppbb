export function modelRuntimeHonesty() {
  return {
    ownedModels: true,
    vendorRentalDefault: false,
    weightBinariesInRepo: false,
    localLexiconRuntime: true,
    neuralWeightsOptional: true,
    sotaClaimsForbidden: true,
    enterpriseDefaultLocked: true,
    note:
      'In-process African linguistic runtime ships today. Neural weight binaries deploy via VERBALAB_WEIGHTS_URL / model pods — not committed to git.',
  };
}

export function modelRuntimeCatalog() {
  return {
    id: 'verbalab-model-runtime',
    title: 'VerbaLab Model Runtime',
    blurb:
      'Local Own AI runtime: African linguistic engine in-process, deployable neural weights, quality eval vs baselines, and gov/bank/hospital production unlocks.',
    honesty: modelRuntimeHonesty(),
    docs: '/docs/MODEL_RUNTIME.md',
    adr: '/docs/adr/0325-verbalab-model-runtime.md',
  };
}

export function deployShape() {
  return {
    mode: process.env.VERBALAB_WEIGHTS_URL?.trim()
      ? 'neural_remote'
      : process.env.VERBALAB_MODEL_BASE_URL?.trim()
        ? 'http_model_pods'
        : 'local_lexicon',
    env: {
      VERBALAB_LOCAL_MODEL_RUNTIME: process.env.VERBALAB_LOCAL_MODEL_RUNTIME ?? '1 (default on)',
      VERBALAB_MODEL_BASE_URL: process.env.VERBALAB_MODEL_BASE_URL || null,
      VERBALAB_WEIGHTS_URL: process.env.VERBALAB_WEIGHTS_URL || null,
      VERBALAB_MODEL_API_KEY: process.env.VERBALAB_MODEL_API_KEY ? '[set]' : null,
      VERBALAB_OWN_AI_FIXTURE: process.env.VERBALAB_OWN_AI_FIXTURE ?? null,
      VERBALAB_ALLOW_VENDOR_FALLBACK: process.env.VERBALAB_ALLOW_VENDOR_FALLBACK ?? null,
      VERBALAB_REGION: process.env.VERBALAB_REGION || null,
    },
    pods: [
      { modality: 'mt', path: '/translate', family: 'translate-fm' },
      { modality: 'stt', path: '/audio/transcriptions', family: 'echo' },
      { modality: 'tts', path: '/audio/speech', family: 'voice-fm' },
      { modality: 'chat', path: '/chat/completions', family: 'atlas' },
      { modality: 'embed', path: '/embeddings', family: 'vector-fm' },
      { modality: 'ocr', path: '/ocr', family: 'vision-fm' },
      { modality: 'clone', path: '/voice-clones', family: 'voice-fm' },
    ],
    upgrade:
      'Point VERBALAB_MODEL_BASE_URL at model-serving pods, or VERBALAB_WEIGHTS_URL at a weight bundle. API surface stays identical.',
  };
}
