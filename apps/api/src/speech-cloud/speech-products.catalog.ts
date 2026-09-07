export type SpeechProductStatus = 'shipped' | 'partial' | 'deferred';

export type SpeechProductRow = {
  id: string;
  name: string;
  status: SpeechProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 16 product map (VL-150). Hub only — does not reimplement STT/TTS. */
export function speechProductCatalog(): SpeechProductRow[] {
  return [
    {
      id: 'speech',
      name: 'VerbaLab Speech',
      status: 'shipped',
      api: 'GET /v1/speech/products',
      console: '/speech',
      notes: 'Speech Cloud parent hub (VL-150). Maps library products onto existing audio surfaces.',
    },
    {
      id: 'batch-stt',
      name: 'Batch STT',
      status: 'shipped',
      api: 'POST /v1/audio/transcriptions',
      console: '/audio',
      notes: 'File upload STT via OpenAI Whisper gateway (VL-041). Metered in seconds.',
    },
    {
      id: 'streaming-stt',
      name: 'Streaming STT',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Realtime streaming recognition. Scheduled Phase 17 / VL-122 — not claimed shipped.',
    },
    {
      id: 'tts',
      name: 'Text-to-speech',
      status: 'shipped',
      api: 'POST /v1/audio/speech',
      console: '/audio',
      notes: 'Vendor + own TTS voices (VL-042/121). Character metering.',
    },
    {
      id: 'voices',
      name: 'Voice catalog',
      status: 'shipped',
      api: 'GET /v1/audio/voices',
      console: '/audio',
      notes: 'Public voice list for synthesis.',
    },
    {
      id: 'interpret',
      name: 'Live interpreter',
      status: 'shipped',
      api: 'POST /v1/interpret',
      console: '/interpret',
      notes: 'STT → MT → TTS compose (VL-061). Not contact-center Call Intelligence.',
    },
    {
      id: 'voice-biometrics',
      name: 'Voice Biometrics',
      status: 'partial',
      api: '/v1/voice-clones',
      console: '/audio',
      notes: 'Consent-gated voice cloning (VL-064). Not speaker verification / anti-spoof biometrics OS.',
    },
    {
      id: 'voice-faq',
      name: 'Voice agents (FAQ)',
      status: 'partial',
      api: '/v1/voice',
      console: '/voice',
      notes: 'Twilio FAQ voice agent (VL-080 area). Call Intelligence analytics deferred to Phase 24.',
    },
    {
      id: 'speaker-intelligence',
      name: 'Speaker Intelligence',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Speaker ID / diarization — Phase 18. Not shipped.',
    },
    {
      id: 'accent-intelligence',
      name: 'Accent Intelligence',
      status: 'partial',
      api: 'POST /v1/accents/detect',
      console: '/accents',
      notes: 'Spoken accent cue scoring via Language Cloud (VL-132). Acoustic accent models remain deferred.',
    },
    {
      id: 'emotion-ai',
      name: 'Emotion AI',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Audio emotion detection — Phase 20. Text emotion under Language Intelligence is separate.',
    },
    {
      id: 'audio-intelligence',
      name: 'Audio Intelligence',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'General audio analysis — Phase 21.',
    },
    {
      id: 'pronunciation-ai',
      name: 'Pronunciation AI',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Pronunciation scoring/feedback — Phase 22.',
    },
    {
      id: 'wake-word',
      name: 'Wake Word Engine',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Wake-word / keyword spotting — Phase 23.',
    },
    {
      id: 'call-intelligence',
      name: 'Call Intelligence',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Contact-center call analytics — Phase 24. Voice FAQ is not Call Intelligence.',
    },
    {
      id: 'audio-enhancement',
      name: 'Audio Enhancement',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Denoise / enhancement pipeline — later Speech Cloud depth. Not claimed.',
    },
    {
      id: 'speech-analytics',
      name: 'Speech Analytics',
      status: 'deferred',
      api: null,
      console: '/usage',
      notes: 'Speech usage/quality analytics product — Phase 25. Usage summary covers STT/TTS metering today.',
    },
  ];
}

export function speechArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_speech_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    rest: true,
    graphql: true,
    realtime: false,
    streaming: false,
    batch: true,
    enterpriseApis: true,
    sdk: '@verbalab/sdk',
    cli: '@verbalab/cli',
    openapi: '/v1/openapi.json',
    monitoring: true,
    billing: true,
    analytics: 'usage_summary_only',
    infra: ['docker', 'fly', 'github_actions', 'terraform', 'eks'],
    terraform: true,
    kubernetes: true,
    docker: true,
    cloudProvider: 'aws',
    primaryRegion: 'af-south-1',
  };
}
