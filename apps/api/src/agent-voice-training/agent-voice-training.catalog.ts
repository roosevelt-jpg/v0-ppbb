export type AgentVoiceTrainingCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export function agentVoiceTrainingCatalog() {
  return {
    product: 'agent-voice-training',
    title: 'Agent Voice Training',
    blurb:
      'Train AI agents to speak like VerbaLab models across African languages and beyond — persona packs, multilingual TTS routing, and SDK export for agent builders.',
    capabilities: [
      {
        id: 'model-catalog',
        name: 'VerbaLab speech model catalog',
        status: 'shipped' as AgentVoiceTrainingCapabilityStatus,
        api: 'GET /v1/agent-voice-training/models',
        notes: 'Atlas TTS, Echo STT, VerbaVoice chat, and clone-backed personas for agent builders.',
      },
      {
        id: 'language-coverage',
        name: 'Africa + beyond language coverage',
        status: 'shipped' as AgentVoiceTrainingCapabilityStatus,
        api: 'GET /v1/agent-voice-training/languages',
        notes: 'African Language Registry plus global trade languages (en, fr, ar, pt, zh, …).',
      },
      {
        id: 'persona-train',
        name: 'Agent speech persona training',
        status: 'shipped' as AgentVoiceTrainingCapabilityStatus,
        api: 'POST /v1/agent-voice-training/personas',
        notes: 'Create a persona bound to VerbaLab models + languages; train to ready status.',
      },
      {
        id: 'preview-speak',
        name: 'Multilingual speak preview',
        status: 'shipped' as AgentVoiceTrainingCapabilityStatus,
        api: 'POST /v1/agent-voice-training/personas/:id/preview',
        notes: 'Preview how the agent would speak a line in a selected language.',
      },
      {
        id: 'sdk-export',
        name: 'Agent builder SDK pack',
        status: 'shipped' as AgentVoiceTrainingCapabilityStatus,
        api: 'GET /v1/agent-voice-training/personas/:id/sdk',
        notes: 'Export system prompt, TTS routes, and sample client code for LangChain / custom agents.',
      },
    ],
  };
}

export function agentVoiceTrainingHonesty() {
  return {
    note:
      'Persona training configures routing + style packs against VerbaLab speech models. It does not download proprietary model weights. Voice clone enrollment still requires consent via Voice Cloning.',
    residencyDefault: 'af',
  };
}

/** Speech / voice models agent builders can attach. */
export function agentSpeechModels() {
  return [
    {
      id: 'atlas-tts',
      name: 'Atlas TTS',
      modality: 'tts',
      family: 'atlas',
      api: 'POST /v1/tts/synthesize',
      languages: 'africa+global',
      blurb: 'Neural TTS for natural African and global speech.',
    },
    {
      id: 'verba-voice-chat',
      name: 'VerbaVoice Chat',
      modality: 'voice_llm',
      family: 'verba-voice',
      api: 'POST /v1/chat/completions',
      languages: 'africa+global',
      blurb: 'Spoken-aware LLM replies that can speak back in the user language.',
    },
    {
      id: 'echo-stt',
      name: 'Echo STT',
      modality: 'stt',
      family: 'echo',
      api: 'POST /v1/speech/recognize',
      languages: 'africa+global',
      blurb: 'Speech recognition for agent listen loops.',
    },
    {
      id: 'voice-clone-persona',
      name: 'Enterprise voice clone',
      modality: 'tts_clone',
      family: 'voice-cloning',
      api: 'POST /v1/voice-cloning/enroll',
      languages: 'clone-dependent',
      blurb: 'Consented clone voices for branded agent personas.',
    },
    {
      id: 'intent-preserving-dub',
      name: 'Intent-preserving dub',
      modality: 'dub',
      family: 'moonshot',
      api: 'POST /v1/intent-preserving-dub/score',
      languages: 'africa+global',
      blurb: 'Keep social effect when agents rephrase across languages.',
    },
  ];
}

/** Global trade languages beyond the African registry seed. */
export const BEYOND_AFRICA_LANGUAGES = [
  { code: 'en', name: 'English', region: 'Global' },
  { code: 'fr', name: 'French', region: 'Global / Francophone' },
  { code: 'ar', name: 'Arabic', region: 'MENA / Global' },
  { code: 'pt', name: 'Portuguese', region: 'Lusophone / Global' },
  { code: 'es', name: 'Spanish', region: 'Global' },
  { code: 'zh', name: 'Chinese (Mandarin)', region: 'Global' },
  { code: 'hi', name: 'Hindi', region: 'South Asia / Global' },
  { code: 'de', name: 'German', region: 'Europe / Global' },
] as const;
