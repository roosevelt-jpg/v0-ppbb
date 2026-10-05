export type KernelRuntimeStatus = 'shipped' | 'partial' | 'deferred';

export type KernelRuntimeRow = {
  id: string;
  name: string;
  status: KernelRuntimeStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 81 runtime map (VL-214). Internal OS hub — not a customer product. */
export function aiKernelRuntimeCatalog(): KernelRuntimeRow[] {
  return [
    {
      id: 'ai-kernel',
      name: 'VerbaLab AI Kernel',
      status: 'shipped',
      api: 'GET /v1/ai-kernel/products',
      console: '/ai-kernel',
      notes:
        'Internal runtime hub. Routes future Agent/Workflow/Plugin execution through Nest kernel modules. rewrite.',
    },
    {
      id: 'memory-runtime',
      name: 'Memory Runtime',
      status: 'shipped',
      api: 'GET /v1/memory-runtime/engine',
      console: '/memory-runtime',
      notes:
        'Kernel memory over MemoryRecord. Extends Memory Cloud.',
    },
    {
      id: 'prompt-runtime',
      name: 'Prompt Runtime',
      status: 'shipped',
      api: 'GET /v1/prompt-runtime/engine',
      console: '/prompt-runtime',
      notes:
        'Kernel prompt execution over /Variables/validate/cache.',
    },
    {
      id: 'context-runtime',
      name: 'Context Runtime',
      status: 'shipped',
      api: 'GET /v1/context-runtime/engine',
      console: '/context-runtime',
      notes:
        'Kernel assembly over Context Engine. Prioritize/compress/retrieve.',
    },
    {
      id: 'reasoning-runtime',
      name: 'Reasoning Runtime',
      status: 'shipped',
      api: 'GET /v1/reasoning-runtime/engine',
      console: '/reasoning-runtime',
      notes:
        'Kernel reasoning over Plan/reflect/eval/history.',
    },
    {
      id: 'agent-runtime',
      name: 'Agent Runtime',
      status: 'shipped',
      api: 'GET /v1/agent-runtime/engine',
      console: '/agent-runtime',
      notes:
        'Sandbox agents with hard permission allowlists.',
    },
    {
      id: 'workflow-runtime',
      name: 'Workflow Runtime',
      status: 'shipped',
      api: 'GET /v1/workflow-runtime/engine',
      console: '/workflow-runtime',
      notes:
        'Sandbox multi-step workflows with hard permission allowlists. Extends /v1/workflows.',
    },
    {
      id: 'plugin-runtime',
      name: 'Plugin Runtime',
      status: 'shipped',
      api: 'GET /v1/plugin-runtime/engine',
      console: '/plugin-runtime',
      notes:
        'Sandbox plugin registry with hard permission allowlists.',
    },
    {
      id: 'policy-runtime',
      name: 'Policy Runtime',
      status: 'shipped',
      api: 'GET /v1/policy-runtime/engine',
      console: '/policy-runtime',
      notes:
        'Hard-gate enforcement for Agent/Workflow/Plugin. Blocks with 403.',
    },
    {
      id: 'kernel-telemetry',
      name: 'Kernel Telemetry',
      status: 'shipped',
      api: 'GET /v1/ai-kernel/monitoring',
      console: '/ai-kernel',
      notes: 'Foundation monitoring snapshot — full kernel telemetry deferred with runtimes.',
    },
  ];
}

export function aiKernelArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_ai_kernel_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    rest: true,
    graphql: true,
    sdk: '@verbalab/sdk',
    cli: '@verbalab/cli',
    docker: true,
    terraform: true,
    kubernetes: true,
    primaryRegion: 'af-south-1',
    deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    customerFacingProduct: false,
    linuxOsRewrite: false,
    vaiosOs: false,
    regeneratesVolumes1to7: false,
    extendsInferenceCloud: true,
    extendsMemoryCloud: true,
    extendsPromptIntelligence: true,
    extendsContextEngine: true,
    extendsReasoningCloud: true,
    extendsAiOrchestration: true,
    agentActionBoundariesRequired: true,
    policyHardGateRequired: true,
    policyLogOnlyForbidden: true,
  };
}

export function aiKernelSafetyNotes() {
  return {
    agentWorkflowPluginMustSandbox: true,
    scopedPermissionsRequired: true,
    policyMustHardGate: true,
    policyLogOnlyRejected: true,
    note:
      'Agent/Workflow/Plugin Runtimes must have scoped permissions and sandboxing. Policy Runtime must be a hard gate wired into those runtimes, not decoration that only logs.',
  };
}
