export type MepCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type MepCapability = {
  id: string;
  name: string;
  status: MepCapabilityStatus;
  api: string | null;
  notes: string;
};

export type MepSuiteId =
  | 'mmlu'
  | 'humaneval'
  | 'mt_bench'
  | 'translation'
  | 'speech'
  | 'vision'
  | 'reasoning'
  | 'bias'
  | 'safety'
  | 'latency';

export type MepSuite = {
  id: MepSuiteId;
  name: string;
  status: MepCapabilityStatus;
  runnable: boolean;
  existingApi: string | null;
  notes: string;
};

/**
 * Library Phase 103 → Model Evaluation Platform (VL-236).
 * Hub over VL-100 coverage/eval harness — not a global LLM leaderboard OS.
 */
export function modelEvaluationPlatformCatalog() {
  return {
    product: 'VerbaLab Model Evaluation Platform',
    note:
      'Model Evaluation Platform. Extends coverage/eval for translation goldens. Sandbox suites for bias/safety/latency. MMLU/HumanEval/MT-Bench and speech/vision/reasoning corpora stay deferred. Never claims market leadership or SOTA.',
    capabilities: [
      {
        id: 'evaluation-orchestration',
        name: 'Evaluation Orchestration',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Eval run plans with handoff to the translation evaluation harness.',
      },
      {
        id: 'translation-benchmarks',
        name: 'Translation Benchmarks',
        status: 'shipped',
        api: 'POST /v1/eval/run',
        notes: 'Golden exact-match + char similarity (ADR-0034).',
      },
      {
        id: 'bias',
        name: 'Bias Checks',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox heuristic checklist.',
      },
      {
        id: 'safety',
        name: 'Safety Checks',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox policy probes.',
      },
      {
        id: 'latency',
        name: 'Latency',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox latency budget scoring.',
      },
      {
        id: 'leaderboards',
        name: 'Leaderboards',
        status: 'shipped',
        api: 'GET /v1/model-evaluation-platform/leaderboard',
        notes: 'Org-scoped sandbox ranks from local runs.',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'shipped',
        api: 'GET /v1/model-evaluation-platform/reports',
        notes: 'Aggregated run summaries + coverage snapshot link.',
      },
      { id: 'mmlu',
        name: 'MMLU',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox MMLU-style multiple-choice harness (tiny fixture).',
      },
      {
        id: 'humaneval',
        name: 'HumanEval',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox HumanEval-style code fixture harness.',
      },
      {
        id: 'mt-bench',
        name: 'MT Bench',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox multi-turn chat bench fixture.',
      },
      {
        id: 'speech-benchmarks',
        name: 'Speech Benchmarks',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox speech WER-style fixture.',
      },
      {
        id: 'vision-benchmarks',
        name: 'Vision Benchmarks',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox vision caption accuracy fixture.',
      },
      {
        id: 'reasoning-benchmarks',
        name: 'Reasoning Benchmarks',
        status: 'shipped',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox reasoning plan-quality fixture.',
      },
    ] satisfies MepCapability[],
    honesty: modelEvaluationPlatformHonesty(),
    docs: '/docs/MODEL_EVALUATION_PLATFORM.md',
  };
}

export function modelEvaluationSuites(): MepSuite[] {
  return [
    {
      id: 'translation',
      name: 'Translation Benchmarks',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/eval/run',
      notes: 'Handoff to golden harness (fixture/live/oracle).',
    },
    {
      id: 'bias',
      name: 'Bias',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox checklist scores.',
    },
    {
      id: 'safety',
      name: 'Safety',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox refusal/policy probes.',
    },
    {
      id: 'latency',
      name: 'Latency',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox p95 budget vs target ms.',
    },
    {
      id: 'mmlu',
      name: 'MMLU',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Deferred academic suite.',
    },
    {
      id: 'humaneval',
      name: 'HumanEval',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Deferred code suite.',
    },
    {
      id: 'mt_bench',
      name: 'MT Bench',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox multi-turn chat bench.',
    },
    {
      id: 'speech',
      name: 'Speech Benchmarks',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox speech suite.',
    },
    {
      id: 'vision',
      name: 'Vision Benchmarks',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox vision suite.',
    },
    {
      id: 'reasoning',
      name: 'Reasoning Benchmarks',
      status: 'shipped',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox reasoning suite.',
    },
  ];
}

export function modelEvaluationPlatformArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_model_evaluation_platform',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'eval_service_plus_sandbox_runs',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsVl100Coverage: true,
    extendsEvalService: true,
    extendsFoundationModelCloud: true,
    regeneratesVl100: false,
    trainsCompetitiveFoundationWeights: false,
    globalLeaderboardOs: false,
    mmluOs: false,
    sotaClaimsForbidden: true,
    customerFacingProduct: true,
    note:
      'Volume 9 Phase 103: evaluation hub over existing goldens + sandbox suites.',
  };
}

export function modelEvaluationPlatformHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    globalLeaderboardOs: false,
    mmluOs: false,
    humanevalOs: false,
    mtBenchOs: false,
    sotaClaimsForbidden: true,
    regeneratesVl100: false,
    regeneratesVolumes1to8: false,
    openAiReplacementOs: false,
    extendsVl100Coverage: true,
    sandboxSuitesOnlyForBiasSafetyLatency: true,
  };
}

export function modelEvaluationCeilings() {
  return {
    maxRunsPerOrg: 100,
    maxLabelLength: 120,
    mode: 'sandbox',
    note:
      'Sandbox ceilings for eval run plans. Live translation eval still gated by EVAL_LIVE=1 + owner/admin.',
  };
}
