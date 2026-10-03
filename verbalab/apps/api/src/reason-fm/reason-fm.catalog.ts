export function reasonfmCatalog() {
  return {
    id: 'reason-fm',
    title: 'Reason FM',
    phase: 98,
    vl: 'Shipped.',
    modality: 'chat',
    blurb: 'VerbaLab reasoning specialist',
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
      modality: 'VERBALAB_CHAT_URL',
      apiKey: 'VERBALAB_MODEL_API_KEY',
      fixture: 'VERBALAB_OWN_AI_FIXTURE',
    },
  };
}

export function reasonfmCapabilities() {
  return [
    { id: 'serve', label: 'Serve via VerbaLab model endpoint', status: 'wired' },
    { id: 'registry', label: 'Listed in model registry / FM cloud', status: 'wired' },
    { id: 'eval', label: 'Eval handoff to coverage / model evaluation', status: 'wired' },
    { id: 'fixture', label: 'VERBALAB_OWN_AI_FIXTURE local path', status: 'wired' },
  ];
}

export function reasonfmHonesty() {
  return reasonfmCatalog().honesty;
}
