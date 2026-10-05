import { LANGUAGE_SEEDS } from '../languages/language-seeds';

export function meetingTranscriptionHonesty() {
  return {
    product: 'meeting-transcription',
    africaWideStt: true,
    meetingPlatformApi: true,
    textAndVoiceOut: true,
    note:
      'Meeting Transcription ships Africa-wide language coverage for developers building Zoom/Meet-class products — STT to text, optional translate, optional spoken recap.',
  };
}

export function meetingTranscriptionLanguages() {
  const african = LANGUAGE_SEEDS.filter((l) => l.tier === 'strategic_african');
  const vendor = LANGUAGE_SEEDS.filter((l) => l.tier === 'vendor');
  return {
    count: LANGUAGE_SEEDS.length,
    africanCount: african.length,
    vendorCount: vendor.length,
    languages: LANGUAGE_SEEDS.map((l) => ({
      code: l.code,
      name: l.nameEn,
      native: l.nameNative ?? null,
      script: l.script ?? null,
      rtl: Boolean(l.rtl),
      tier: l.tier,
      stt: true,
      meeting: true,
    })),
  };
}

export function meetingTranscriptionCatalog() {
  return {
    id: 'meeting-transcription',
    title: 'Meeting Transcription',
    blurb:
      'Transcribe meetings across every VerbaLab African language — text transcripts, subtitles, optional translation, and spoken recap for meeting platforms.',
    honesty: meetingTranscriptionHonesty(),
    docs: '/docs/MEETING_TRANSCRIPTION.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
      deployment: 'Africa primary island; optional EU/US residency islands',
    },
    capabilities: [
      {
        id: 'languages',
        name: 'Africa-wide STT language list',
        status: 'shipped' as const,
        api: 'GET /v1/meeting-transcription/languages',
      },
      {
        id: 'transcribe',
        name: 'Meeting audio → text',
        status: 'shipped' as const,
        api: 'POST /v1/meeting-transcription/transcribe',
      },
      {
        id: 'transcribe-translate',
        name: 'Transcribe + translate',
        status: 'shipped' as const,
        api: 'POST /v1/meeting-transcription/transcribe',
      },
      {
        id: 'voice-recap',
        name: 'Spoken meeting recap',
        status: 'shipped' as const,
        api: 'POST /v1/meeting-transcription/recap',
      },
      {
        id: 'session',
        name: 'Meeting session API for platforms',
        status: 'shipped' as const,
        api: 'POST /v1/meeting-transcription/sessions',
      },
    ],
  };
}
