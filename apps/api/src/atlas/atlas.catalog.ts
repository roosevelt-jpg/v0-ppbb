export type AtlasCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type AtlasCapability = {
  id: string;
  name: string;
  status: AtlasCapabilityStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 92 → Atlas (VL-225).
 * Large multilingual reasoning family scaffold — not trained competitive weights.
 */
export function atlasCatalog() {
  return {
    product: 'VerbaLab Atlas',
    note:
      'Atlas. Interface scaffold for a large multilingual reasoning family. Capabilities map to existing Gateway/Reasoning Runtime/MLOps hubs. Does not ship trained Atlas weights, OpenAI replacement, or frontier-lab compute (Volume 9 README).',
    capabilities: [
      {
        id: 'reasoning',
        name: 'Reasoning',
        status: 'shipped',
        api: 'GET /v1/reasoning-runtime/engine',
        notes: 'Handoff to Reasoning Runtime.',
      },
      {
        id: 'planning',
        name: 'Planning',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/plan',
        notes: 'Plan/reflect via Reasoning Runtime; no tool execution OS.',
      },
      {
        id: 'coding',
        name: 'Coding',
        status: 'shipped',
        api: 'POST /v1/atlas/specialize',
        notes: 'domain=coding — specialist scaffold via Reasoning Runtime + chat. Not trained Atlas weights.',
      },
      {
        id: 'math',
        name: 'Math',
        status: 'shipped',
        api: 'POST /v1/atlas/specialize',
        notes: 'domain=math — specialist scaffold via Reasoning Runtime + chat.',
      },
      {
        id: 'scientific-reasoning',
        name: 'Scientific Reasoning',
        status: 'shipped',
        api: 'POST /v1/atlas/specialize',
        notes: 'domain=scientific — specialist scaffold via Reasoning Runtime + chat.',
      },
      {
        id: 'business-reasoning',
        name: 'Business Reasoning',
        status: 'shipped',
        api: 'POST /v1/atlas/specialize',
        notes: 'domain=business — specialist scaffold via Reasoning Runtime + chat.',
      },
      {
        id: 'legal-reasoning',
        name: 'Legal Reasoning',
        status: 'shipped',
        api: 'POST /v1/atlas/specialize',
        notes: 'domain=legal — specialist scaffold via Reasoning Runtime + chat.',
      },
      {
        id: 'medical-reasoning',
        name: 'Medical Reasoning',
        status: 'shipped',
        api: 'POST /v1/atlas/specialize',
        notes: 'domain=medical — specialist scaffold via Reasoning Runtime + chat.',
      },
      {
        id: 'financial-reasoning',
        name: 'Financial Reasoning',
        status: 'shipped',
        api: 'POST /v1/atlas/specialize',
        notes: 'domain=financial — specialist scaffold via Reasoning Runtime + chat.',
      },
      {
        id: 'multilingual',
        name: 'Multilingual',
        status: 'shipped',
        api: 'POST /v1/chat/completions',
        notes: 'Vendor chat/Gateway today.',
      },
      {
        id: 'long-context',
        name: 'Long Context',
        status: 'shipped',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Context Runtime assemble/compress.',
      },
      {
        id: 'function-calling',
        name: 'Function Calling',
        status: 'shipped',
        api: 'POST /v1/agent-runtime/runs',
        notes: 'Agent Runtime sandbox + Policy hard-gate.',
      },
      {
        id: 'tool-use',
        name: 'Tool Use',
        status: 'shipped',
        api: 'POST /v1/agent-runtime/runs',
        notes: 'Same Agent Runtime sandbox path.',
      },
      {
        id: 'training-pipeline',
        name: 'Training Pipeline',
        status: 'shipped',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'Handoff to Model Training Platform /.',
      },
      {
        id: 'inference',
        name: 'Inference',
        status: 'shipped',
        api: 'POST /v1/chat/completions',
        notes: 'Gateway chat.ted weights.',
      },
      {
        id: 'evaluation',
        name: 'Evaluation',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Model Evaluation Platform — MMLU suite still deferred.',
      },
      {
        id: 'benchmarking',
        name: 'Benchmarking',
        status: 'shipped',
        api: 'GET /v1/model-evaluation-platform/leaderboard',
        notes: 'Org-scoped sandbox ranks.',
      },
      {
        id: 'serving-platform',
        name: 'Serving Platform',
        status: 'shipped',
        api: 'GET /v1/model-serving/engine',
        notes: 'Model Serving hub.',
      },
    ] satisfies AtlasCapability[],
    honesty: atlasHonesty(),
    docs: '/docs/ATLAS.md',
  };
}

export function atlasCapabilities(): AtlasCapability[] {
  return atlasCatalog().capabilities;
}

export function atlasArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_atlas_scaffold',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'handoffs_to_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsGateway: true,
    extendsReasoningRuntime: true,
    extendsModelTrainingPlatform: true,
    extendsModelEvaluationPlatform: true,
    extendsFoundationModelCloud: true,
    regeneratesVolumes1to8: false,
    trainsCompetitiveFoundationWeights: false,
    shipsTrainedAtlasWeights: false /* binaries deploy via VERBALAB_CHAT_URL */,
    openAiReplacementOs: false,
    frontierLabOs: false,
    customerFacingProduct: true,
    scaffoldOnly: false,
    note:
      'Volume 9 Phase 92: Atlas as discoverable family scaffold. Real inference uses bought Gateway models until research charter + compute exist (ADR-0041 / ADR-0135).',
  };
}

export function atlasHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    shipsTrainedAtlasWeights: false /* binaries deploy via VERBALAB_CHAT_URL */,
    openAiReplacementOs: false,
    frontierLabOs: false,
    regeneratesVolumes1to8: false,
    regeneratesReasoningRuntime: false,
    scaffoldOnly: false,
    extendsGateway: true,
    extendsMlopsTrack: true,
  };
}
