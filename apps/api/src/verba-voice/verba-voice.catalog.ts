export function verbaVoiceHonesty() {
  return {
    product: 'verba-voice',
    grokLikeVoiceMode: true,
    africaWideLanguages: true,
    duplexWebRtc: false,
    note:
      'Verba Voice is VerbaLab’s always-on voice session API for developers — speak in any catalog African language, get text + spoken replies. Full WebRTC barge-in mesh is next; today’s surface is authenticated turn sessions with STT → Atlas → Voice FM.',
  };
}

export function verbaVoiceCatalog() {
  return {
    id: 'verba-voice',
    title: 'Verba Voice',
    blurb:
      'Grok-class conversational voice for African languages — open a session, stream turns as audio or text, hear Atlas reply in Voice FM.',
    honesty: verbaVoiceHonesty(),
    docs: '/docs/VERBA_VOICE.md',
    capabilities: [
      {
        id: 'sessions',
        name: 'Voice session lifecycle',
        status: 'shipped' as const,
        api: 'POST /v1/verba-voice/sessions',
      },
      {
        id: 'turn-audio',
        name: 'Audio turn (STT → chat → TTS)',
        status: 'shipped' as const,
        api: 'POST /v1/verba-voice/turns',
      },
      {
        id: 'turn-text',
        name: 'Text turn with spoken reply',
        status: 'shipped' as const,
        api: 'POST /v1/verba-voice/text-turns',
      },
      {
        id: 'events',
        name: 'Session event stream (SSE)',
        status: 'shipped' as const,
        api: 'GET /v1/verba-voice/sessions/:id/events',
      },
      {
        id: 'webrtc',
        name: 'Full-duplex WebRTC barge-in',
        status: 'deferred' as const,
        api: 'POST /v1/verba-voice/webrtc',
      },
    ],
  };
}
