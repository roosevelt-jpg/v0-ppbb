export type CreativeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type CreativeCapability = {
  id: string;
  name: string;
  status: CreativeCapabilityStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** VerbaCreative media suite — parity surface for creative-suite-class products. */
export function creativeMediaEngineCatalog() {
  return {
    product: 'VerbaCreative Media',
    note:
      'Shipped creative media APIs for voice change, isolation, sound effects, music beds, voice design, image/video generation, and ads composition — Africa-first branding on VerbaLab runtimes and partner connectors.',
    capabilities: [
      {
        id: 'text-to-speech',
        name: 'Text to Speech',
        status: 'shipped',
        api: 'POST /v1/audio/speech',
        console: '/voice-studio',
        notes: 'Neural TTS + Voice Studio + Voice FM.',
      },
      {
        id: 'speech-to-text',
        name: 'Speech to Text',
        status: 'shipped',
        api: 'POST /v1/audio/transcriptions',
        console: '/speech',
        notes: 'Echo STT + Speech Recognition console.',
      },
      {
        id: 'voice-changer',
        name: 'Voice Changer',
        status: 'shipped',
        api: 'POST /v1/creative-media/voice-changer',
        console: '/creative-media',
        notes: 'Pitch / tempo transform on uploaded speech.',
      },
      {
        id: 'sound-effects',
        name: 'Text to Sound Effects',
        status: 'shipped',
        api: 'POST /v1/creative-media/sound-effects',
        console: '/creative-media',
        notes: 'Prompted SFX beds synthesized on-platform.',
      },
      {
        id: 'voice-cloning',
        name: 'Voice Cloning',
        status: 'shipped',
        api: 'POST /v1/voice-cloning/enroll',
        console: '/voice-cloning',
        notes: 'Consent-gated cloning with review + watermark.',
      },
      {
        id: 'voice-isolator',
        name: 'Voice Isolator',
        status: 'shipped',
        api: 'POST /v1/creative-media/isolate',
        console: '/creative-media',
        notes: 'Speech isolation path (also /v1/audio-intelligence/isolate).',
      },
      {
        id: 'music',
        name: 'AI Music Generator',
        status: 'shipped',
        api: 'POST /v1/creative-media/music',
        console: '/creative-media',
        notes: 'Prompted music beds for ads, education, and civic spots.',
      },
      {
        id: 'studio',
        name: 'Studio',
        status: 'shipped',
        api: 'GET /v1/voice-studio/engine',
        console: '/voice-studio',
        notes: 'African Voice Studio for scripts, presets, and renders.',
      },
      {
        id: 'voice-design',
        name: 'Voice Design',
        status: 'shipped',
        api: 'POST /v1/creative-media/voice-design',
        console: '/creative-media',
        notes: 'Describe a brand/character voice; returns a design profile for TTS.',
      },
      {
        id: 'ai-voice-generator',
        name: 'AI Voice Generator',
        status: 'shipped',
        api: 'POST /v1/audio/speech',
        console: '/neural-tts',
        notes: 'Same TTS stack with Voice FM / neural voices.',
      },
      {
        id: 'image',
        name: 'AI Image Generator',
        status: 'partial',
        api: 'POST /v1/creative-media/image',
        console: '/creative-media',
        notes: 'Campaign SVG stills for African brand use cases — not diffusion image models.',
      },
      {
        id: 'video',
        name: 'AI Video Generator',
        status: 'partial',
        api: 'POST /v1/creative-media/video',
        console: '/creative-media',
        notes: 'Storyboard package + partner video-voice / Higgsfield / Runway paths — not full MP4 render.',
      },
      {
        id: 'ads',
        name: 'Ads Engine',
        status: 'shipped',
        api: 'POST /v1/creative-media/ads',
        console: '/creative-media',
        notes: 'Compose script + voice + SFX + music into an ad package.',
      },
      {
        id: 'dubbing',
        name: 'Dubbing',
        status: 'shipped',
        api: 'POST /v1/video-voice/dub',
        console: '/video-voice',
        notes: 'Video voice dubbing job (STT→translate→TTS) on Translate FM + Voice FM; metered dubbing credits.',
      },
    ] satisfies CreativeCapability[],
    honesty: {
      note: 'Creative media APIs are on-platform synthesizers plus partner connectors — not a claim of third-party model weights.',
      partnerVideoConnectors: true,
      proceduralAudioBeds: true,
      imageVideoPartial: true,
    },
    docs: '/docs',
  };
}
