export type FmcProductStatus = 'shipped' | 'partial' | 'deferred';

export type FmcProductRow = {
  id: string;
  name: string;
  status: FmcProductStatus;
  api: string | null;
  console: string | null;
  modality: string;
  notes: string;
};

/**
 * Library Phase 91 → Foundation Model Cloud Foundation (VL-224).
 * Catalog of VerbaLab model-family products. Named models are scaffolds —
 * this hub does not train competitive foundation weights (Volume 9 README).
 */
export function foundationModelCloudCatalog(): FmcProductRow[] {
  return [
    {
      id: 'foundation-model-cloud',
      name: 'Foundation Model Cloud',
      status: 'shipped',
      api: 'GET /v1/foundation-model-cloud/products',
      console: '/foundation-model-cloud',
      modality: 'hub',
      notes:
        'First-class model-family hub. Extends Inference Cloud + AI Kernel.',
    },
    {
      id: 'atlas',
      name: 'VerbaLab Atlas',
      status: 'shipped',
      api: 'GET /v1/atlas/engine',
      console: '/atlas',
      modality: 'multilingual_reasoning',
      notes:
        'Large multilingual reasoning family scaffold (Phase 92). Interface + MLOps handoffs.',
    },
    { id: 'baobab',
      name: 'VerbaLab Baobab',
      status: 'shipped',
      api: 'GET /v1/baobab/engine',
      console: '/baobab',
      modality: 'african_languages',
      notes: 'African language FM scaffold hub.',
    },
    {
      id: 'echo',
      name: 'VerbaLab Echo',
      status: 'shipped',
      api: 'GET /v1/echo/engine',
      console: '/echo',
      modality: 'speech_audio',
      notes: 'Speech/audio FM scaffold hub.',
    },
    {
      id: 'voice',
      name: 'VerbaLab Voice',
      status: 'shipped',
      api: 'GET /v1/voice-fm/engine',
      console: '/voice-fm',
      modality: 'voice_synthesis',
      notes: 'Voice synthesis FM scaffold hub.',
    },
    {
      id: 'vision',
      name: 'VerbaLab Vision',
      status: 'shipped',
      api: 'GET /v1/vision-fm/engine',
      console: '/vision-fm',
      modality: 'vision_documents',
      notes: 'Vision/document FM scaffold hub.',
    },
    {
      id: 'vector',
      name: 'VerbaLab Vector',
      status: 'shipped',
      api: 'GET /v1/vector-fm/engine',
      console: '/vector-fm',
      modality: 'embeddings',
      notes: 'Embedding FM scaffold hub.',
    },
    {
      id: 'reason',
      name: 'VerbaLab Reason',
      status: 'shipped',
      api: 'GET /v1/reason-fm/engine',
      console: '/reason-fm',
      modality: 'reasoning_planning',
      notes: 'Reasoning FM scaffold hub.',
    },
    {
      id: 'edge',
      name: 'VerbaLab Edge',
      status: 'shipped',
      api: 'GET /v1/edge/engine',
      console: '/edge',
      modality: 'on_device_slm',
      notes: 'On-device SLM FM scaffold hub.',
    },
    {
      id: 'fusion',
      name: 'VerbaLab Fusion',
      status: 'shipped',
      api: 'GET /v1/fusion/engine',
      console: '/fusion',
      modality: 'multimodal',
      notes: 'Multimodal fusion FM scaffold hub.',
    },
    {
      id: 'translate',
      name: 'VerbaLab Translate',
      status: 'shipped',
      api: 'GET /v1/translate-fm/engine',
      console: '/translate-fm',
      modality: 'translation',
      notes: 'Translation FM scaffold hub.',
    },
    {
      id: 'model-training-platform',
      name: 'Model Training Platform',
      status: 'shipped',
      api: 'GET /v1/model-training-platform/engine',
      console: '/model-training-platform',
      modality: 'mlops',
      notes:
        'Training orchestration over rented-GPU jobs (Phase 102). Experiment plans + LoRA/instruction handoff.',
    },
    {
      id: 'model-evaluation-platform',
      name: 'Model Evaluation Platform',
      status: 'shipped',
      api: 'GET /v1/model-evaluation-platform/engine',
      console: '/model-evaluation-platform',
      modality: 'mlops',
      notes:
        'Eval hub over coverage/eval harness + sandbox bias/safety/latency (Phase 103). org-scoped sandbox ranks from local runs.',
    },
    {
      id: 'model-registry',
      name: 'Model Registry',
      status: 'shipped',
      api: 'GET /v1/model-registry/engine',
      console: '/model-registry',
      modality: 'mlops',
      notes:
        'Registry governance over model_registry (Phase 104). Cards/versions/approvals/deploy plans.',
    },
  ];
}

export function foundationModelCloudArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_foundation_model_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    eks: true,
    eksPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsInferenceCloud: true,
    extendsAiKernel: true,
    regeneratesVolumes1to8: false,
    customerFacingProduct: true,
    trainsCompetitiveFoundationWeights: false,
    openAiReplacementOs: false,
    modelFamilyScaffoldCatalog: true,
    note:
      'Foundation Model Cloud delivers MLOps scaffolding plus shipped family hubs (Baobab/Echo/Voice/Vision/Vector/Reason/Edge/Fusion/Translate). Named families are interface scaffolds — not trained competitive weights.',
  };
}

export function foundationModelCloudHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    shipsTrainedAtlasBaobabEtc: false,
    familyHubsShipped: true,
    openAiReplacementOs: false,
    regeneratesVolumes1to8: false,
    regeneratesInferenceCloud: false,
    regeneratesAiKernel: false,
    modelFamilyScaffoldCatalog: true,
    mLOpsPlatformShipped: false,
    modelTrainingPlatformPartial: true,
    modelEvaluationPlatformPartial: true,
    modelRegistryPartial: true,
    hexagonalRewrite: false,
    linuxOsRewrite: false,
  };
}
