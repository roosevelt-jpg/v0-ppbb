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
      api: 'POST /v1/audio/speech',
      console: '/audio',
      notes: 'Vendor + own TTS voices with character metering (VL-042/121). Streaming/batch TTS productization is Phase 28.',
    },
    {
      id: 'natural-voices',
      name: 'Natural Voices',
      status: 'shipped',
      api: 'GET /v1/audio/voices',
      console: '/audio',
      notes: 'Stock voice catalog (male/female/personalities via provider voices). Children/dialect-native catalogs deferred.',
    },
    {
      id: 'voice-cloning',
      name: 'Voice Cloning Platform',
      status: 'partial',
      api: '/v1/voice-clones',
      console: '/audio',
      notes:
        'ElevenLabs Instant Voice Cloning with explicit consent, abuse review, watermark (VL-064). Professional multi-hour cloning deferred to Phase 29.',
    },
    {
      id: 'instant-voice-cloning',
      name: 'Instant Voice Cloning',
      status: 'partial',
      api: 'POST /v1/voice-clones',
      console: '/audio',
      notes: 'Consent-gated instant clone enrollment (VL-064). Speak via clone:{id} on speech endpoint.',
    },
    {
      id: 'voice-studio',
      name: 'Professional Voice Studio',
      status: 'shipped',
      api: 'GET /v1/audio/voices',
      console: '/audio',
      notes: 'African Voice Studio UX — presets, clone lifecycle, preview (VL-120). Timeline/SSML editor deferred to Phase 31.',
    },
    {
      id: 'emotion-voice',
      name: 'Emotion Voice',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Expressive/emotion-conditioned TTS (Phase 30). Speech Emotion AI (VL-154) is detection, not synthesis.',
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
      status: 'partial',
      api: 'POST /v1/audio-intelligence/enhance',
      console: '/audio-intelligence',
      notes: 'Noise-gate enhance under Audio Intelligence (VL-155). Spectral ML denoise / podcast mastering deferred to Phase 32.',
    },
    {
      id: 'voice-restoration',
      name: 'Voice Restoration',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Archive restoration / bandwidth extension product deferred to Phase 32.',
    },
    {
      id: 'audio-mastering',
      name: 'Audio Mastering',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Broadcast loudness / mastering suite deferred to Phase 32.',
    },
    {
      id: 'voice-biometrics',
      name: 'Voice Biometrics',
      status: 'partial',
      api: 'GET /v1/speakers/engine',
      console: '/speaker-intelligence',
      notes:
        'Speaker verify/identify via local fingerprints (VL-152). NIST-grade biometrics, anti-spoof, liveness deferred to Phase 33.',
    },
    {
      id: 'voice-authentication',
      name: 'Voice Authentication',
      status: 'partial',
      api: 'POST /v1/speakers/verify',
      console: '/speaker-intelligence',
      notes: 'Verification score path exists (VL-152). Production auth factor + fraud/liveness deferred to Phase 33.',
    },
    {
      id: 'voice-profiles',
      name: 'Voice Profiles',
      status: 'partial',
      api: 'GET /v1/speakers',
      console: '/speaker-intelligence',
      notes: 'Speaker profiles for intelligence (VL-152). Marketable voice profile product deferred.',
    },
    {
      id: 'voice-marketplace',
      name: 'Voice Marketplace',
      status: 'deferred',
      api: null,
      console: '/marketplace',
      notes: 'Buy/sell/license custom voices (Phase 34). Existing Marketplace is localization assets, not voice SKUs.',
    },
    {
      id: 'voice-faq',
      name: 'Voice agents (FAQ)',
      status: 'partial',
      api: '/v1/voice',
      console: '/voice',
      notes: 'Twilio FAQ voice agent (VL-084). Not Voice Cloud core synthesis — listed for navigation honesty.',
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
    streaming: false,
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
