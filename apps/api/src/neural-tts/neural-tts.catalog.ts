export type TtsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type TtsCapability = {
  id: string;
  name: string;
  status: TtsCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 28 → VerbaLab Neural Text-to-Speech (VL-171). */
export function neuralTtsEngineCatalog() {
  return {
    product: 'VerbaLab Neural TTS',
    note:
      'Neural TTS engine over OpenAI TTS + own rented voices + clone:{id}. Batch synthesize shipped; streaming is chunk SSE after full synthesis — not vendor low-latency token streaming. Not ElevenLabs/Polly/Azure Speech parity.',
    capabilities: [
      {
        id: 'batch-tts',
        name: 'Batch Text-to-Speech',
        status: 'shipped',
        api: 'POST /v1/tts/synthesize',
        notes: 'JSON text → audio bytes. Legacy: POST /v1/audio/speech.',
      },
      {
        id: 'streaming-tts',
        name: 'Streaming Text-to-Speech',
        status: 'shipped',
        api: 'POST /v1/tts/stream',
        notes:
          'Shipped SSE audio chunk delivery after full synthesis. True vendor token streaming deferred.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'shipped',
        api: 'POST /v1/tts/stream',
        notes:
          'Shipped SSE realtime delivery of audio chunks. Bidirectional realtime sessions deferred.',
      },
      {
        id: 'natural-voices',
        name: 'Natural Voices',
        status: 'shipped',
        api: 'GET /v1/tts/voices',
        notes: 'OpenAI stock + own:* African voices. Clones appear when approved for workspace.',
      },
      {
        id: 'male-voices',
        name: 'Male Voices',
        status: 'shipped',
        api: 'GET /v1/tts/voices?gender=male',
        notes: 'echo, onyx, own:yo-tunde, own:en-kofi, …',
      },
      {
        id: 'female-voices',
        name: 'Female Voices',
        status: 'shipped',
        api: 'GET /v1/tts/voices?gender=female',
        notes: 'nova, shimmer, own:sw-aisha, own:am-hanna, …',
      },
      { id: 'children-voices',
        name: 'Children Voices',
        status: 'shipped',
        api: 'GET /v1/tts/voices?age=child',
        notes: 'Child-age voice filter on neural TTS catalog.',
      },
      {
        id: 'multilingual',
        name: 'Multiple Languages',
        status: 'shipped',
        api: 'POST /v1/tts/synthesize',
        notes: 'language hint + multilingual providers; own:* covers sw/yo/am/en.',
      },
      {
        id: 'dialects',
        name: 'Multiple Dialects',
        status: 'shipped',
        api: 'GET /v1/tts/voices',
        notes:
          'Shipped dialect tags on enriched catalog where known. Full dialect-native TTS deferred.',
      },
      {
        id: 'regional-accents',
        name: 'Regional Accents',
        status: 'shipped',
        api: 'GET /v1/tts/voices',
        notes:
          'Shipped accent/region tags on own:* and selected stock voices. Acoustic accent control deferred.',
      },
      {
        id: 'personalities',
        name: 'Voice Personalities',
        status: 'shipped',
        api: 'GET /v1/tts/voices',
        notes:
          'Shipped personality labels on catalog (warm, formal, …). Emotion synthesis via Emotion Voice.',
      },
      {
        id: 'enterprise-voices',
        name: 'Enterprise Voices',
        status: 'shipped',
        api: 'GET /v1/voice-cloning/library',
        notes:
          'Shipped consent-gated clone:{id} voices via Voice Cloning Platform (/172).',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs, gateway.synthesize logs, audit audio.synthesized / tts.synthesized.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/tts/engine/analytics',
        notes: 'Shipped TTS usage summary. Full Voice Analytics hub: /voice-analytics.',
      },
    ] satisfies TtsCapability[],
    engines: [
      {
        id: 'openai_tts',
        name: 'OpenAI TTS',
        role: 'primary',
        modes: ['batch', 'chunk_sse'],
      },
      {
        id: 'own_tts',
        name: 'Own TTS (rented)',
        role: 'secondary',
        modes: ['batch', 'chunk_sse'],
      },
      {
        id: 'elevenlabs_clone',
        name: 'ElevenLabs Instant Voice Cloning',
        role: 'clone',
        modes: ['batch', 'chunk_sse'],
      },
    ],
    links: {
      console: '/neural-tts',
      hub: '/voice-cloud',
      studio: '/audio',
      legacy: '/v1/audio/speech',
      openapi: '/v1/openapi.json',
      docs: '/docs/NEURAL_TTS.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@verbalab/sdk',
      cli: '@verbalab/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    },
  };
}
