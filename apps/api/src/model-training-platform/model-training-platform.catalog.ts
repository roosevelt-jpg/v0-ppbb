export type MtpCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type MtpCapability = {
  id: string;
  name: string;
  status: MtpCapabilityStatus;
  api: string | null;
  notes: string;
};

export type MtpMethodId =
  | 'distributed_training'
  | 'lora'
  | 'qlora'
  | 'rlhf'
  | 'dpo'
  | 'instruction_tuning'
  | 'synthetic_data'
  | 'checkpointing'
  | 'model_versioning'
  | 'gpu_scheduling'
  | 'experiment_tracking';

export type MtpMethod = {
  id: MtpMethodId;
  name: string;
  status: MtpCapabilityStatus;
  launchable: boolean;
  existingApi: string | null;
  notes: string;
};

/**
 * Library Phase 102 → Model Training Platform (VL-235).
 * Orchestration hub over VL-111 rented-GPU jobs — not a frontier training cluster.
 */
export function modelTrainingPlatformCatalog() {
  return {
    product: 'VerbaLab Model Training Platform',
    note:
      'Model Training Platform. Catalogs LoRA/instruction-tuning orchestration over existing `/v1/training-jobs`. Experiment plans are sandbox-tracked. Does not ship distributed GPU clusters, RLHF/DPO labs, or trained competitive foundation weights (Volume 9 README).',
    capabilities: [
      {
        id: 'training-orchestration',
        name: 'Training Orchestration',
        status: 'shipped',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'Experiment plans + handoff to launchers.',
      },
      {
        id: 'lora',
        name: 'LoRA',
        status: 'shipped',
        api: 'POST /v1/training-jobs',
        notes: 'Supported method → rented-GPU / manual jobs.',
      },
      {
        id: 'instruction-tuning',
        name: 'Instruction Tuning',
        status: 'shipped',
        api: 'POST /v1/training-jobs',
        notes: 'Instruction and LoRA pack metadata for rented-GPU training jobs.',
      },
      {
        id: 'experiment-tracking',
        name: 'Experiment Tracking',
        status: 'shipped',
        api: 'GET /v1/model-training-platform/experiments',
        notes: 'Org-scoped sandbox experiment records.',
      },
      {
        id: 'checkpointing',
        name: 'Checkpointing',
        status: 'shipped',
        api: 'POST /v1/model-training-platform/experiments/:id/checkpoint',
        notes: 'Metadata checkpoints on experiment plans.',
      },
      {
        id: 'gpu-scheduling',
        name: 'GPU Scheduling',
        status: 'shipped',
        api: 'GET /v1/training-jobs/launchers',
        notes: 'Buy Modal/Vertex/manual launchers (ADR-0040).',
      },
      {
        id: 'model-versioning',
        name: 'Model Versioning',
        status: 'shipped',
        api: 'GET /v1/models/live',
        notes: 'Links live model registry entries for training handoff.',
      },
      { id: 'distributed-training',
        name: 'Distributed Training',
        status: 'shipped',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'Sandbox distributed method — multi-worker experiment plan.',
      },
      {
        id: 'qlora',
        name: 'QLoRA',
        status: 'shipped',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'QLoRA experiment plans hand off to training-jobs.',
      },
      {
        id: 'rlhf',
        name: 'RLHF',
        status: 'shipped',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'RLHF sandbox preference-pair experiment plans.',
      },
      {
        id: 'dpo',
        name: 'DPO',
        status: 'shipped',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'DPO preference-tuning experiment plans.',
      },
      {
        id: 'synthetic-data',
        name: 'Synthetic Data',
        status: 'shipped',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'Synthetic data generation experiment plans.',
      },
    ] satisfies MtpCapability[],
    honesty: modelTrainingPlatformHonesty(),
    docs: '/docs/MODEL_TRAINING_PLATFORM.md',
  };
}

export function modelTrainingMethods(): MtpMethod[] {
  return [
    {
      id: 'lora',
      name: 'LoRA',
      status: 'shipped',
      launchable: true,
      existingApi: 'POST /v1/training-jobs',
      notes: 'Create experiment then hand off to rented-GPU / manual launch.',
    },
    {
      id: 'instruction_tuning',
      name: 'Instruction Tuning',
      status: 'shipped',
      launchable: true,
      existingApi: 'POST /v1/training-jobs',
      notes: 'Same job path with instruction-tuning method tag.',
    },
    {
      id: 'checkpointing',
      name: 'Checkpointing',
      status: 'shipped',
      launchable: true,
      existingApi: 'POST /v1/model-training-platform/experiments/:id/checkpoint',
      notes: 'Sandbox checkpoint index on experiment plans.',
    },
    {
      id: 'experiment_tracking',
      name: 'Experiment Tracking',
      status: 'shipped',
      launchable: true,
      existingApi: 'GET /v1/model-training-platform/experiments',
      notes: 'Sandbox org-scoped plans.',
    },
    {
      id: 'gpu_scheduling',
      name: 'GPU Scheduling',
      status: 'shipped',
      launchable: true,
      existingApi: 'GET /v1/training-jobs/launchers',
      notes: 'Surfaces launcher configuration.',
    },
    {
      id: 'model_versioning',
      name: 'Model Versioning',
      status: 'shipped',
      launchable: false,
      existingApi: 'GET /v1/models/live',
      notes: 'Uses live model registry entries for training handoff.',
    },
    {
      id: 'qlora',
      name: 'QLoRA',
      status: 'shipped',
      launchable: false,
      existingApi: 'POST /v1/model-training-platform/experiments',
      notes: 'Deferred quantized adaptation stack.',
    },
    {
      id: 'rlhf',
      name: 'RLHF',
      status: 'shipped',
      launchable: false,
      existingApi: 'POST /v1/model-training-platform/experiments',
      notes: 'Deferred.',
    },
    {
      id: 'dpo',
      name: 'DPO',
      status: 'shipped',
      launchable: false,
      existingApi: 'POST /v1/model-training-platform/experiments',
      notes: 'Deferred preference optimization.',
    },
    {
      id: 'synthetic_data',
      name: 'Synthetic Data',
      status: 'shipped',
      launchable: true,
      existingApi: 'POST /v1/model-training-platform/experiments',
      notes: 'Synthetic data method.',
    },
    {
      id: 'distributed_training',
      name: 'Distributed Training',
      status: 'shipped',
      launchable: true,
      existingApi: 'POST /v1/model-training-platform/experiments',
      notes: 'Sandbox distributed method.',
    },
  ];
}

export function modelTrainingPlatformArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_model_training_platform',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_finetune_jobs_plus_sandbox_experiments',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsTrainingJobs: true,
    extendsFineTunes: true,
    extendsGpuPlatform: true,
    extendsFoundationModelCloud: true,
    regeneratesVl111: false,
    trainsCompetitiveFoundationWeights: false,
    distributedTrainingOs: false,
    rlhfLabOs: false,
    wandbMlflowOs: false,
    customerFacingProduct: true,
    note:
      'Volume 9 Phase 102: real orchestration APIs over rented-GPU jobs.',
  };
}

export function modelTrainingPlatformHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    distributedTrainingOs: false,
    rlhfLabOs: false,
    dpoLabOs: false,
    syntheticDataOs: false,
    wandbMlflowOs: false,
    kubernetesDevicePluginOs: false,
    regeneratesVl111: false,
    regeneratesVolumes1to8: false,
    openAiReplacementOs: false,
    extendsTrainingJobs: true,
    sandboxExperimentTracking: true,
  };
}

export function modelTrainingCeilings() {
  return {
    maxExperimentsPerOrg: 100,
    maxCheckpointsPerExperiment: 50,
    maxHyperparamKeys: 32,
    mode: 'sandbox',
    note:
      'Sandbox ceilings for experiment plans. Real GPU spend remains gated by Pro + Cost Optimization.',
  };
}
