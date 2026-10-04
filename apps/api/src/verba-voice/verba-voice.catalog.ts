export function verbaVoiceHonesty() {
  return {
    product: 'verba-voice',
    grokLikeVoiceMode: true,
    africaWideLanguages: true,
    duplexWebRtc: true,
    note:
      'Verba Voice is VerbaLab’s always-on voice session API for developers — speak in any catalog African language, get text + spoken replies. Turn sessions (STT → Atlas → Voice FM) and full-duplex WebRTC signaling with barge-in events are both shipped.',
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
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
      deployment: 'Africa primary island; optional EU/US residency islands',
    },
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
        status: 'shipped' as const,
        api: 'POST /v1/verba-voice/webrtc',
      },
      {
        id: 'webrtc-signal',
        name: 'WebRTC signal exchange',
        status: 'shipped' as const,
        api: 'POST /v1/verba-voice/webrtc/signal',
      },
      {
        id: 'barge-in',
        name: 'Duplex barge-in control',
        status: 'shipped' as const,
        api: 'POST /v1/verba-voice/webrtc/barge-in',
      },
    ],
  };
}
