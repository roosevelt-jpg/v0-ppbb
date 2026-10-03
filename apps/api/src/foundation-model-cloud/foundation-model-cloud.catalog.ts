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
    {
      id: 'baobab',
      name: 'VerbaLab Baobab',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'african_languages',
      notes: 'African language foundation family scaffold (Phase 93).',
    },
    {
      id: 'echo',
      name: 'VerbaLab Echo',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'speech_audio',
      notes: 'Speech/audio family scaffold (Phase 94). Extends Speech Cloud.',
    },
    {
      id: 'voice',
      name: 'VerbaLab Voice',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'voice_synthesis',
      notes: 'Voice synthesis/cloning family scaffold (Phase 95). Extends Voice Cloud.',
    },
    {
      id: 'vision',
      name: 'VerbaLab Vision',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'vision_documents',
      notes: 'Vision/document understanding family scaffold (Phase 96).',
    },
    {
      id: 'vector',
      name: 'VerbaLab Vector',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'embeddings',
      notes: 'Embedding family scaffold (Phase 97). Extends Embedding Cloud.',
    },
    {
      id: 'reason',
      name: 'VerbaLab Reason',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'reasoning_planning',
      notes: 'Reasoning/planning family scaffold (Phase 98). Extends Reasoning Cloud/Runtime.',
    },
    {
      id: 'edge',
      name: 'VerbaLab Edge',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'on_device_slm',
      notes: 'On-device SLM family scaffold (Phase 99).',
    },
    {
      id: 'fusion',
      name: 'VerbaLab Fusion',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'multimodal',
      notes: 'Multimodal fusion family scaffold (Phase 100).',
    },
    {
      id: 'translate',
      name: 'VerbaLab Translate',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'translation',
      notes: 'Translation family scaffold (Phase 101). Extends Language Cloud.',
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
    kubernetes: true,
    kubernetesPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsInferenceCloud: true,
    extendsAiKernel: true,
    regeneratesVolumes1to8: false,
    customerFacingProduct: true,
    trainsCompetitiveFoundationWeights: false,
    openAiReplacementOs: false,
    modelFamilyScaffoldCatalog: true,
    note:
      'Foundation Model Cloud delivers MLOps scaffolding for training, evaluation, and registry. Named foundation families stay deferred until trained weights ship.',
  };
}

export function foundationModelCloudHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    shipsTrainedAtlasBaobabEtc: false,
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
