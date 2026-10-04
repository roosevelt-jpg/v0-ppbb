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
      notes: 'Speech Cloud parent hub. Maps library products onto existing audio surfaces.',
    },
    {
      id: 'speech-engine',
      name: 'Speech Recognition Engine',
      status: 'shipped',
      api: 'GET /v1/speech/engine',
      console: '/speech-recognition',
      notes: 'Batch + segment SSE STT, vocabulary, subtitles.',
    },
    {
      id: 'batch-stt',
      name: 'Batch STT',
      status: 'shipped',
      api: 'POST /v1/speech/recognize',
      console: '/speech-recognition',
      notes: 'File STT + timestamps/confidence/vocab (/151). Legacy: POST /v1/audio/transcriptions.',
    },
    {
      id: 'streaming-stt',
      name: 'Streaming STT',
      status: 'shipped',
      api: 'POST /v1/speech/stream',
      console: '/speech-recognition',
      notes:
        'Shipped SSE segment stream over Whisper verbose_json. Live mic WebSocket deferred.',
    },
    {
      id: 'tts',
      name: 'Text-to-speech',
      status: 'shipped',
      api: 'POST /v1/audio/speech',
      console: '/audio',
      notes: 'Vendor + own TTS voices (/121). Character metering.',
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
      notes: 'STT → MT → TTS compose. Not contact-center Call Intelligence.',
    },
    {
      id: 'voice-biometrics',
      name: 'Voice Biometrics',
      status: 'shipped',
      api: 'GET /v1/voice-biometrics/engine',
      console: '/voice-biometrics',
      notes:
        'Shipped consent-gated enroll/verify/identify over Speaker Intel (/064). Not NIST/PAD biometrics OS. Voice cloning remains separate.',
    },
    {
      id: 'voice-faq',
      name: 'Voice agents (FAQ)',
      status: 'shipped',
      api: 'GET /v1/voice/status',
      console: '/voice',
      notes:
        'Shipped Twilio FAQ voice agent. Call Intelligence analytics stay on',
    },
    {
      id: 'speaker-intelligence',
      name: 'Speaker Intelligence',
      status: 'shipped',
      api: 'GET /v1/speakers/engine',
      console: '/speaker-intelligence',
      notes:
        'Shipped profiles, local fingerprints, verify/identify, gap diarization. NIST biometrics / neural diarization deferred.',
    },
    {
      id: 'accent-intelligence',
      name: 'Accent Intelligence',
      status: 'shipped',
      api: 'GET /v1/accents/engine',
      console: '/accent-intelligence',
      notes:
        'Shipped cue detection/classify + analytics (/153). Dialect via Language Cloud. Acoustic regional models deferred.',
    },
    {
      id: 'emotion-ai',
      name: 'Emotion AI',
      status: 'shipped',
      api: 'GET /v1/emotion/engine',
      console: '/emotion-intelligence',
      notes:
        'Shipped speech emotion detect + SSE. Text cues + soft audio proxies — trained SER deferred. Language Intel emotion remains separate.',
    },
    {
      id: 'audio-intelligence',
      name: 'Audio Intelligence',
      status: 'shipped',
      api: 'GET /v1/audio-intelligence/engine',
      console: '/audio-intelligence',
      notes:
        'Shipped noise/silence analyze, gate enhance, linear upscale, VAD isolate. Echo AEC deferred. Not Krisp/Demucs.',
    },
    {
      id: 'pronunciation-ai',
      name: 'Pronunciation AI',
      status: 'shipped',
      api: 'GET /v1/pronunciation/engine',
      console: '/pronunciation-intelligence',
      notes:
        'Shipped assess/score/coach + phoneme/fluency heuristics. ELSA/SpeechAce / forced alignment deferred.',
    },
    {
      id: 'wake-word',
      name: 'Wake Word Engine',
      status: 'shipped',
      api: 'GET /v1/wake-word/engine',
      console: '/wake-word',
      notes:
        'Shipped wake/keyword/trigger spotting via text/STT. Porcupine on-device DNN deferred.',
    },
    {
      id: 'meeting-transcription',
      name: 'Meeting Transcription',
      status: 'shipped',
      api: 'GET /v1/meeting-transcription/engine',
      console: '/meeting-transcription',
      notes:
        'Africa-wide meeting STT for Zoom/Meet-class platforms — sessions, transcribe+translate, spoken recap. Residency: af-south-1 / VERBALAB_REGION=af.',
    },
    {
      id: 'verba-voice',
      name: 'Verba Voice',
      status: 'shipped',
      api: 'GET /v1/verba-voice/engine',
      console: '/verba-voice',
      notes:
        'Grok-class conversational voice sessions (STT→Atlas→TTS). WebRTC duplex deferred. Africa residency default.',
    },
    {
      id: 'call-intelligence',
      name: 'Call Intelligence',
      status: 'shipped',
      api: 'GET /v1/call-intelligence/engine',
      console: '/call-intelligence',
      notes:
        'Shipped call ingest/transcribe/analyze/report. Heuristic coaching/QA/compliance. Gong OS deferred. Voice FAQ ≠ this.',
    },
    {
      id: 'audio-enhancement',
      name: 'Audio Enhancement',
      status: 'shipped',
      api: 'POST /v1/audio-intelligence/enhance',
      console: '/audio-intelligence',
      notes:
        'Shipped noise-gate enhance under Audio Intelligence. Spectral ML denoise / Adobe Enhance deferred.',
    },
    {
      id: 'speech-analytics',
      name: 'Speech Analytics',
      status: 'shipped',
      api: 'GET /v1/speech-analytics/engine',
      console: '/speech-analytics',
      notes:
        'Shipped usage/languages/dialects/costs/accuracy proxies/report. BI cloud / WER lab deferred. Language Analytics separate.',
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
    realtime: true,
    streaming: true,
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
