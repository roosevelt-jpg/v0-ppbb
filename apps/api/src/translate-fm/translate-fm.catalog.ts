export function translatefmCatalog() {
  return {
    id: 'translate-fm',
    title: 'Translate FM',
    phase: 101,
    vl: 'Shipped.',
    modality: 'mt',
    blurb: 'African MT foundation — glossary + TM beat generic LLM translate.',
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
      modality: 'VERBALAB_MT_URL',
      apiKey: 'VERBALAB_MODEL_API_KEY',
      fixture: 'VERBALAB_OWN_AI_FIXTURE',
    },
  };
}

export function translatefmCapabilities() {
  return [
    { id: 'serve', label: 'Serve via VerbaLab model endpoint', status: 'wired' },
    { id: 'registry', label: 'Listed in model registry / FM cloud', status: 'wired' },
    { id: 'eval', label: 'Eval handoff to coverage / model evaluation', status: 'wired' },
    { id: 'fixture', label: 'VERBALAB_OWN_AI_FIXTURE local path', status: 'wired' },
  ];
}

export function translatefmHonesty() {
  return translatefmCatalog().honesty;
}
