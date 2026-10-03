import { EMOTION_VOICE_PROFILES } from './emotion-profiles';

export type EmotionVoiceCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EmotionVoiceCapability = {
  id: string;
  name: string;
  status: EmotionVoiceCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 30 → Emotion Voice Engine (VL-173). */
export function emotionVoiceEngineCatalog() {
  return {
    product: 'VerbaLab Emotion Voice',
    note:
      'Emotion-conditioned synthesis façade over Neural TTS. Soft prosody + voice recommendations for OpenAI/own voices; ElevenLabs style settings on clone:{id} when available. Not trained expressive TTS / Hume / Azure Neural Emotion. Distinct from Speech Emotion Intelligence detection.',
    capabilities: [
      {
        id: 'emotion-profiles',
        name: 'Emotion & domain profiles',
        status: 'shipped',
        api: 'GET /v1/emotion-voice/profiles',
        notes: `${EMOTION_VOICE_PROFILES.length} profiles: emotions + medical/legal/sales/support domains.`,
      },
      {
        id: 'emotion-synthesis',
        name: 'Emotion Voice Synthesis',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes:
          'Shipped soft prosody + preferred voice; clone voices may pass ElevenLabs style settings. Native emotion-conditioned OpenAI models deferred.',
      },
      {
        id: 'streaming',
        name: 'Streaming Emotion Synthesis',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/stream',
        notes: 'Shipped chunk SSE after synthesis (same honesty as ).',
      },
      {
        id: 'happy',
        name: 'Happy',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile happy',
      },
      {
        id: 'sad',
        name: 'Sad',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile sad',
      },
      {
        id: 'angry',
        name: 'Angry',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile angry',
      },
      {
        id: 'fear',
        name: 'Fear',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile fear',
      },
      {
        id: 'excited',
        name: 'Excited',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile excited',
      },
      {
        id: 'professional',
        name: 'Professional',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain tone',
      },
      {
        id: 'calm',
        name: 'Calm',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile calm',
      },
      {
        id: 'urgent',
        name: 'Urgent',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile urgent',
      },
      {
        id: 'empathetic',
        name: 'Empathetic',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile empathetic',
      },
      {
        id: 'medical',
        name: 'Medical',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain register — not medical advice',
      },
      {
        id: 'legal',
        name: 'Legal',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain register',
      },
      {
        id: 'sales',
        name: 'Sales',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain register',
      },
      {
        id: 'customer-support',
        name: 'Customer Support',
        status: 'shipped',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain register',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Audit emotion_voice.synthesized / streamed',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/emotion-voice/engine/analytics',
        notes: 'Shipped usage by profile from audit events; TTS metering shared with',
      },
    ] satisfies EmotionVoiceCapability[],
    related: {
      speechEmotionDetection: '/docs/EMOTION_INTELLIGENCE.md',
      neuralTts: '/docs/NEURAL_TTS.md',
      note: 'detects emotion in speech/text. synthesizes with emotion profiles.',
    },
    links: {
      console: '/emotion-voice',
      hub: '/voice-cloud',
      neuralTts: '/neural-tts',
      speechEmotion: '/emotion-intelligence',
      openapi: '/v1/openapi.json',
      docs: '/docs/EMOTION_VOICE.md',
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
      trainedExpressiveModel: false,
    },
  };
}
