export function vectorfmCatalog() {
  return {
    id: 'vector-fm',
    title: 'Vector FM',
    phase: 97,
    vl: 'Shipped.',
    modality: 'embed',
    blurb: 'VerbaLab embeddings FM',
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
      modality: 'VERBALAB_EMBED_URL',
      apiKey: 'VERBALAB_MODEL_API_KEY',
      fixture: 'VERBALAB_OWN_AI_FIXTURE',
    },
  };
}

export function vectorfmCapabilities() {
  return [
    { id: 'serve', label: 'Serve via VerbaLab model endpoint', status: 'wired' },
    { id: 'registry', label: 'Listed in model registry / FM cloud', status: 'wired' },
    { id: 'eval', label: 'Eval handoff to coverage / model evaluation', status: 'wired' },
    { id: 'fixture', label: 'VERBALAB_OWN_AI_FIXTURE local path', status: 'wired' },
  ];
}

export function vectorfmHonesty() {
  return vectorfmCatalog().honesty;
}
