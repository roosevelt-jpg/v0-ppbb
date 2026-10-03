export function echoCatalog() {
  return {
    id: 'echo',
    title: 'Echo',
    phase: 94,
    vl: 'VL-227',
    modality: 'stt',
    blurb: 'VerbaLab speech recognition FM',
    honesty: {
      ownedModels: true,
      vendorRentalDefault: false,
      shipsTrainedCompetitiveWeightsInRepo: false,
      servedViaVerbaLabModelEndpoints: true,
      credentialsConfiguredSeparately: true,
      sotaClaimsRequireEvalEvidence: true,
    },
    endpointEnv: {
      base: 'VERBALAB_MODEL_BASE_URL',
      modality: 'VERBALAB_STT_URL',
      apiKey: 'VERBALAB_MODEL_API_KEY',
      fixture: 'VERBALAB_OWN_AI_FIXTURE',
    },
  };
}

export function echoCapabilities() {
  return [
    { id: 'serve', label: 'Serve via VerbaLab model endpoint', status: 'wired' },
    { id: 'registry', label: 'Listed in model registry / FM cloud', status: 'wired' },
    { id: 'eval', label: 'Eval handoff to coverage / model evaluation', status: 'wired' },
    { id: 'fixture', label: 'VERBALAB_OWN_AI_FIXTURE local path', status: 'wired' },
  ];
}

export function echoHonesty() {
  return echoCatalog().honesty;
}
