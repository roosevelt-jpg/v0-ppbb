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
        'Voice Cloud parent hub. Maps library Voice Cloud products onto existing TTS, clones, and studio surfaces.',
    },
    {
      id: 'neural-tts',
      name: 'Neural Text-to-Speech',
      status: 'shipped',
      api: 'GET /v1/tts/engine',
      console: '/neural-tts',
      notes:
        'Shipped Neural TTS: batch synthesize + chunk SSE stream over OpenAI/own/clone voices. True vendor token streaming deferred. Legacy: POST /v1/audio/speech.',
    },
    {
      id: 'natural-voices',
      name: 'Natural Voices',
      status: 'shipped',
      api: 'GET /v1/tts/voices',
      console: '/neural-tts',
      notes:
        'Shipped enriched catalog with gender/personality/dialect tags. Children voices deferred. Legacy: GET /v1/audio/voices.',
    },
    {
      id: 'voice-cloning',
      name: 'Voice Cloning Platform',
      status: 'shipped',
      api: 'GET /v1/voice-cloning/engine',
      console: '/voice-cloning',
      notes:
        'Shipped enterprise cloning hub: consent, ownership, licensing, permissions, pro enrollment, enrollment SSE + watermark (extends ).',
    },
    {
      id: 'instant-voice-cloning',
      name: 'Instant Voice Cloning',
      status: 'shipped',
      api: 'POST /v1/voice-cloning/enroll',
      console: '/voice-cloning',
      notes: 'Consent-gated instant enrollment (/172). Speak via clone:{id}.',
    },
    {
      id: 'voice-studio',
      name: 'Professional Voice Studio',
      status: 'shipped',
      api: 'GET /v1/voice-studio/engine',
      console: '/voice-studio',
      notes:
        'Shipped Voice Studio hub: library, SSML lite, pronunciation lexicon, linear timeline, compare/test + `/audio` African UX. Not a nonlinear DAW.',
    },
    {
      id: 'emotion-voice',
      name: 'Emotion Voice',
      status: 'shipped',
      api: 'GET /v1/emotion-voice/engine',
      console: '/emotion-voice',
      notes:
        'Shipped emotion/domain synthesis profiles: soft prosody + voice pick + clone style settings + chunk SSE. Trained expressive TTS deferred. Distinct from detection.',
    },
    {
      id: 'verba-voice',
      name: 'Verba Voice',
      status: 'shipped',
      api: 'GET /v1/verba-voice/engine',
      console: '/verba-voice',
      notes:
        'Grok-class conversational voice for African languages. Sessions + text/audio turns. Africa residency (af / jnb).',
    },
    { id: 'voice-conversion',
      name: 'Voice Conversion',
      status: 'shipped',
      api: 'POST /v1/voice-enhancement/convert',
      console: null,
      notes: 'Sandbox voice conversion via enhancement convert profile.',
    },
    {
      id: 'voice-enhancement',
      name: 'Voice Enhancement',
      status: 'shipped',
      api: 'GET /v1/voice-enhancement/engine',
      console: '/voice-enhancement',
      notes:
        'Shipped Voice Enhancement Platform: profile pipelines over PCM heuristics (mic/podcast/meeting/broadcast/restore). Krisp/Adobe Enhance deferred.',
    },
    {
      id: 'voice-restoration',
      name: 'Voice Restoration',
      status: 'shipped',
      api: 'POST /v1/voice-enhancement/enhance',
      console: '/voice-enhancement',
      notes:
        'Shipped heuristic voice_restoration profile. Archival ML bandwidth extension deferred.',
    },
    {
      id: 'audio-mastering',
      name: 'Audio Mastering',
      status: 'shipped',
      api: 'POST /v1/voice-enhancement/enhance',
      console: '/voice-enhancement',
      notes:
        'Shipped broadcast soft-limit profile. LUFS broadcast mastering suite deferred.',
    },
    {
      id: 'voice-biometrics',
      name: 'Voice Biometrics',
      status: 'shipped',
      api: 'GET /v1/voice-biometrics/engine',
      console: '/voice-biometrics',
      notes:
        'Shipped Voice Biometrics: encrypted templates, deletion, heuristic anti-spoof/liveness/risk over NIST/PAD certified path deferred.',
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
        'Shipped speaker profiles used as biometric subjects. Marketable voice SKU profiles live on Voice Marketplace.',
    },
    {
      id: 'voice-marketplace',
      name: 'Voice Marketplace',
      status: 'shipped',
      api: 'GET /v1/voice-marketplace/engine',
      console: '/voice-marketplace',
      notes:
        'Shipped Voice SKU publish/license/ratings. Celebrity without rights forbidden; cross-tenant clone synthesis deferred.',
    },
    {
      id: 'voice-analytics',
      name: 'Voice Analytics',
      status: 'shipped',
      api: 'GET /v1/voice-analytics/engine',
      console: '/voice-analytics',
      notes:
        'Shipped usage/voices/revenue/latency/quality aggregates. Distinct from Speech Analytics; BI dashboard deferred.',
    },
    {
      id: 'voice-faq',
      name: 'Voice agents (FAQ)',
      status: 'shipped',
      api: 'GET /v1/voice/status',
      console: '/voice',
      notes:
        'Shipped Twilio FAQ voice agent. Navigation honesty — not Voice Cloud core synthesis.',
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
