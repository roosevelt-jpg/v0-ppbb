export type VoiceProductStatus = 'shipped' | 'partial' | 'deferred';

export type VoiceProductRow = {
  id: string;
  name: string;
  status: VoiceProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 27 product map (VL-170). Hub only — does not reimplement TTS/clones. */
export function voiceProductCatalog(): VoiceProductRow[] {
  return [
    {
      id: 'voice',
      name: 'VerbaLab Voice',
      status: 'shipped',
      api: 'GET /v1/voice-cloud/products',
      console: '/voice-cloud',
      notes:
        'Voice Cloud parent hub (VL-170). Maps library Voice Cloud products onto existing TTS, clones, and studio surfaces.',
    },
    {
      id: 'neural-tts',
      name: 'Neural Text-to-Speech',
      status: 'shipped',
      api: 'GET /v1/tts/engine',
      console: '/neural-tts',
      notes:
        'Shipped Neural TTS (VL-171): batch synthesize + chunk SSE stream over OpenAI/own/clone voices. True vendor token streaming deferred. Legacy: POST /v1/audio/speech.',
    },
    {
      id: 'natural-voices',
      name: 'Natural Voices',
      status: 'shipped',
      api: 'GET /v1/tts/voices',
      console: '/neural-tts',
      notes:
        'Shipped enriched catalog with gender/personality/dialect tags (VL-171). Children voices deferred. Legacy: GET /v1/audio/voices.',
    },
    {
      id: 'voice-cloning',
      name: 'Voice Cloning Platform',
      status: 'shipped',
      api: 'GET /v1/voice-cloning/engine',
      console: '/voice-cloning',
      notes:
        'Shipped enterprise cloning hub (VL-172): consent, ownership, licensing, permissions, pro enrollment, enrollment SSE + watermark (extends VL-064).',
    },
    {
      id: 'instant-voice-cloning',
      name: 'Instant Voice Cloning',
      status: 'shipped',
      api: 'POST /v1/voice-cloning/enroll',
      console: '/voice-cloning',
      notes: 'Consent-gated instant enrollment (VL-064/172). Speak via clone:{id}.',
    },
    {
      id: 'voice-studio',
      name: 'Professional Voice Studio',
      status: 'shipped',
      api: 'GET /v1/voice-studio/engine',
      console: '/voice-studio',
      notes:
        'Shipped Voice Studio hub (VL-174): library, SSML lite, pronunciation lexicon, linear timeline, compare/test + VL-120 `/audio` African UX. Not a nonlinear DAW.',
    },
    {
      id: 'emotion-voice',
      name: 'Emotion Voice',
      status: 'shipped',
      api: 'GET /v1/emotion-voice/engine',
      console: '/emotion-voice',
      notes:
        'Shipped emotion/domain synthesis profiles (VL-173): soft prosody + voice pick + clone style settings + chunk SSE. Trained expressive TTS deferred. Distinct from VL-154 detection.',
    },
    {
      id: 'voice-conversion',
      name: 'Voice Conversion',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Timbre/style conversion between speakers deferred. Not shipped as a product surface.',
    },
    {
      id: 'voice-enhancement',
      name: 'Voice Enhancement',
      status: 'shipped',
      api: 'GET /v1/voice-enhancement/engine',
      console: '/voice-enhancement',
      notes:
        'Shipped Voice Enhancement Platform (VL-175): profile pipelines over VL-155 PCM heuristics (mic/podcast/meeting/broadcast/restore). Krisp/Adobe Enhance deferred.',
    },
    {
      id: 'voice-restoration',
      name: 'Voice Restoration',
      status: 'shipped',
      api: 'POST /v1/voice-enhancement/enhance',
      console: '/voice-enhancement',
      notes:
        'Shipped heuristic voice_restoration profile (VL-175). Archival ML bandwidth extension deferred.',
    },
    {
      id: 'audio-mastering',
      name: 'Audio Mastering',
      status: 'shipped',
      api: 'POST /v1/voice-enhancement/enhance',
      console: '/voice-enhancement',
      notes:
        'Shipped broadcast soft-limit profile (VL-175). LUFS broadcast mastering suite deferred.',
    },
    {
      id: 'voice-biometrics',
      name: 'Voice Biometrics',
      status: 'shipped',
      api: 'GET /v1/voice-biometrics/engine',
      console: '/voice-biometrics',
      notes:
        'Shipped Voice Biometrics (VL-176): encrypted templates, deletion, heuristic anti-spoof/liveness/risk over VL-152. NIST/PAD certified path deferred.',
    },
    {
      id: 'voice-authentication',
      name: 'Voice Authentication',
      status: 'shipped',
      api: 'POST /v1/voice-biometrics/authenticate',
      console: '/voice-biometrics',
      notes:
        'Shipped composite auth decision (verify + spoof + risk). Certified MFA-alone product deferred.',
    },
    {
      id: 'voice-profiles',
      name: 'Voice Profiles',
      status: 'shipped',
      api: 'GET /v1/speakers/profiles',
      console: '/speaker-intelligence',
      notes:
        'Shipped speaker profiles (VL-152) used as biometric subjects. Marketable voice SKU profiles live on Voice Marketplace.',
    },
    {
      id: 'voice-marketplace',
      name: 'Voice Marketplace',
      status: 'shipped',
      api: 'GET /v1/voice-marketplace/engine',
      console: '/voice-marketplace',
      notes:
        'Shipped Voice SKU publish/license/ratings (VL-177). Celebrity without rights forbidden; cross-tenant clone synthesis deferred.',
    },
    {
      id: 'voice-analytics',
      name: 'Voice Analytics',
      status: 'shipped',
      api: 'GET /v1/voice-analytics/engine',
      console: '/voice-analytics',
      notes:
        'Shipped usage/voices/revenue/latency/quality aggregates (VL-178). Distinct from Speech Analytics; BI dashboard deferred.',
    },
    {
      id: 'voice-faq',
      name: 'Voice agents (FAQ)',
      status: 'shipped',
      api: 'GET /v1/voice/status',
      console: '/voice',
      notes:
        'Shipped Twilio FAQ voice agent (VL-084). Navigation honesty — not Voice Cloud core synthesis.',
    },
  ];
}

export function voiceArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_voice_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    rest: true,
    graphql: true,
    realtime: true,
    streaming: true,
    batch: true,
    enterpriseApis: true,
    sdk: '@verbalab/sdk',
    cli: '@verbalab/cli',
    openapi: '/v1/openapi.json',
    monitoring: true,
    billing: true,
    analytics: 'tts_usage_summary_only',
    infra: ['docker', 'fly', 'github_actions', 'terraform', 'eks'],
    terraform: true,
    kubernetes: true,
    docker: true,
    cloudProvider: 'aws',
    primaryRegion: 'af-south-1',
    consentAndAudit: true,
    watermarkOnClones: true,
  };
}
