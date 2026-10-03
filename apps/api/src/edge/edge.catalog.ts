export function edgeCatalog() {
  return {
    id: 'edge',
    title: 'Edge',
    phase: 99,
    vl: 'Shipped.',
    modality: 'edge',
    blurb: 'On-device / edge inference pack',
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
      modality: 'VERBALAB_EDGE_URL',
      apiKey: 'VERBALAB_MODEL_API_KEY',
      fixture: 'VERBALAB_OWN_AI_FIXTURE',
    },
  };
}

export function edgeCapabilities() {
  return [
    { id: 'serve', label: 'Serve via VerbaLab model endpoint', status: 'wired' },
    { id: 'registry', label: 'Listed in model registry / FM cloud', status: 'wired' },
    { id: 'eval', label: 'Eval handoff to coverage / model evaluation', status: 'wired' },
    { id: 'fixture', label: 'VERBALAB_OWN_AI_FIXTURE local path', status: 'wired' },
  ];
}

export function edgeHonesty() {
  return edgeCatalog().honesty;
}
