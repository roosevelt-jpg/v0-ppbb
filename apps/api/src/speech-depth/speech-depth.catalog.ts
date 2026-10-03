export function speechDepthCatalog() {
  return {
    id: 'speech-depth',
    title: 'Speech Depth',
    vl: 'VL-122',
    honesty: {
      ownedModels: true,
      streamingViaOwnStt: true,
      dialectHintsSupported: true,
      vendorRentalDefault: false,
    },
  };
}

export function speechDepthCapabilities() {
  return [
    { id: 'stream', label: 'Streaming transcription sessions', status: 'wired' },
    { id: 'dialects', label: 'Dialect / language hints on STT', status: 'wired' },
    { id: 'own-echo', label: 'Routes to VerbaLab Echo STT', status: 'wired' },
  ];
}
