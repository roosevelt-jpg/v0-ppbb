export function voiceRecorderPluginHonesty() {
  return {
    product: 'voice-recorder-plugin',
    shipped: true,
    platforms: ['ios', 'android'],
    note:
      'Phone Voice Recorder Plugin installs on iOS/Android, records speech, and posts audio to VerbaLab Echo STT for transcripts. Fully wired API + mobile SDK helpers.',
  };
}

export function voiceRecorderPluginCatalog() {
  return {
    id: 'voice-recorder-plugin',
    title: 'Phone Voice Recorder Plugin',
    blurb:
      'Install on phones — tap to record, get African-language transcripts via Echo. Built for field notes, meetings, and CRM capture.',
    honesty: voiceRecorderPluginHonesty(),
    docs: '/docs/VOICE_RECORDER_PLUGIN.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'manifest',
        name: 'Install manifest (iOS/Android)',
        status: 'shipped' as const,
        api: 'GET /v1/voice-recorder-plugin/manifest',
      },
      {
        id: 'sessions',
        name: 'Recording session lifecycle',
        status: 'shipped' as const,
        api: 'POST /v1/voice-recorder-plugin/sessions',
      },
      {
        id: 'transcribe',
        name: 'Upload recording → transcript',
        status: 'shipped' as const,
        api: 'POST /v1/voice-recorder-plugin/transcribe',
      },
      {
        id: 'finalize',
        name: 'Finalize session',
        status: 'shipped' as const,
        api: 'POST /v1/voice-recorder-plugin/finalize',
      },
    ],
  };
}
