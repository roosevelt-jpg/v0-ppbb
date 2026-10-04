export function videoVoiceCatalog() {
  return {
    id: 'video-voice',
    title: 'Video Voice',
    vl: 'Shipped.',
    blurb: 'Clone + dub voices for video in African languages (VerbaLab Voice FM).',
    status: 'shipped',
    api: 'POST /v1/video-voice/dub',
    console: '/video-voice',
    honesty: {
      ownedModels: true,
      elevenLabsOfAfrica: true,
      vendorRentalDefault: false,
      consentRequired: true,
      watermarkRequired: true,
      videoMux: false,
      note: 'Returns a localized dubbed audio track (STT→translate→TTS). Picture/timeline mux is out of band via partner video tools.',
    },
  };
}
