export type AgentFabricStatus = 'shipped' | 'partial' | 'deferred';

export type AgentFabricCapability = {
  id: string;
  name: string;
  status: AgentFabricStatus;
  api: string | null;
  notes: string;
};

export type AgentFabricRoute = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type AgentPipeline = {
  id: string;
  name: string;
  steps: string[];
  notes: string;
};

/**
 * Library Phase 113 → Agent Fabric (VL-246).
 * Cross-cloud agent routing over Agent Runtime — sandboxed + Policy-gated; not LangGraph/AutoGPT OS.
 */
export function agentFabricCapabilityCatalog(): AgentFabricCapability[] {
  return [
    {
      id: 'agent-fabric',
      name: 'Agent Fabric',
      status: 'shipped',
      api: 'GET /v1/agent-fabric/products',
      notes:
        'Agent router hub. Extends Agent Runtime — does not regenerate Sandboxed + Policy-gated.',
    },
    {
      id: 'agent-router',
      name: 'Agent Router',
      status: 'shipped',
      api: 'POST /v1/agent-fabric/route',
      notes: 'Maps agent intents to Runtime handoffs.',
    },
    {
      id: 'agent-discovery',
      name: 'Agent Discovery',
      status: 'shipped',
      api: 'GET /v1/agent-fabric/discover',
      notes: 'Lists workspace agents via Agent Runtime.',
    },
    {
      id: 'agent-communication',
      name: 'Agent Communication',
      status: 'shipped',
      api: 'POST /v1/agent-runtime/collaborate',
      notes: 'Sandbox message exchange via Runtime.',
    },
    {
      id: 'agent-collaboration',
      name: 'Agent Collaboration',
      status: 'shipped',
      api: 'POST /v1/agent-fabric/collaborate',
      notes: 'Façade over Agent Runtime collaborate.',
    },
    {
      id: 'agent-scheduling',
      name: 'Agent Scheduling',
      status: 'shipped',
      api: 'POST /v1/agent-fabric/schedule',
      notes: 'Façade over Runtime schedule stubs.',
    },
    {
      id: 'agent-federation',
      name: 'Agent Federation',
      status: 'shipped',
      api: 'POST /v1/agent-fabric/federate',
      notes: 'Product-handoff federation catalog.s-tenant agent mesh.',
    },
    {
      id: 'agent-messaging',
      name: 'Agent Messaging',
      status: 'shipped',
      api: 'POST /v1/agent-runtime/collaborate',
      notes: 'Sandbox messaging only.',
    },
    {
      id: 'agent-marketplace-integration',
      name: 'Agent Marketplace Integration',
      status: 'shipped',
      api: 'GET /v1/agent-fabric/marketplace',
      notes: 'Counts marketplace listings with kind=agent for fabric routing.',
    },
    {
      id: 'realtime-apis',
      name: 'Realtime APIs',
      status: 'shipped',
      api: 'GET /v1/agent-fabric/stream',
      notes: 'SSE status ticks + optional Event Fabric CloudEvents.',
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: 'shipped',
      api: 'GET /v1/agent-fabric/monitoring',
      notes: 'Route/discover/collaborate/schedule counters + honesty.',
    },
  ];
}

export function agentFabricRoutingTable(): AgentFabricRoute[] {
  return [
    {
      kind: 'discover',
      name: 'Agent Discovery',
      target: 'agent-runtime',
      api: 'GET /v1/agent-runtime/agents',
      cloud: 'ai-kernel',
      notes: 'List workspace agents via Agent Runtime.',
    },
    {
      kind: 'collaborate',
      name: 'Collaboration',
      target: 'agent-runtime',
      api: 'POST /v1/agent-runtime/collaborate',
      cloud: 'ai-kernel',
      notes: 'Sandbox collaboration — Policy-gated.',
    },
    {
      kind: 'schedule',
      name: 'Scheduling',
      target: 'agent-runtime',
      api: 'POST /v1/agent-runtime/schedule',
      cloud: 'ai-kernel',
      notes: 'Schedule stub.',
    },
    {
      kind: 'message',
      name: 'Messaging',
      target: 'agent-runtime',
      api: 'POST /v1/agent-runtime/collaborate',
      cloud: 'ai-kernel',
      notes: 'Sandbox message exchange.',
    },
    {
      kind: 'run',
      name: 'Run',
      target: 'agent-runtime',
      api: 'POST /v1/agent-runtime/run',
      cloud: 'ai-kernel',
      notes: 'Permission-gated sandbox run — live tools forbidden.',
    },
    {
      kind: 'memory',
      name: 'Agent Memory',
      target: 'agent-runtime',
      api: 'POST /v1/agent-runtime/memory',
      cloud: 'ai-kernel',
      notes: 'Agent-scoped Memory Runtime writes.',
    },
    {
      kind: 'marketplace',
      name: 'Marketplace',
      target: 'agent-runtime',
      api: 'GET /v1/agent-runtime/marketplace',
      cloud: 'ecosystem',
      notes: 'Listing counts for kind=agent.',
    },
    {
      kind: 'policy',
      name: 'Policy Runtime',
      target: 'policy-runtime',
      api: 'GET /v1/policy-runtime/engine',
      cloud: 'ai-kernel',
      notes: 'Hard gate for agent actions.',
    },
  ];
}

export function agentFabricPipelines(): AgentPipeline[] {
  return [
    {
      id: 'discover-collaborate',
      name: 'Discover → Collaborate',
      steps: ['discover', 'collaborate'],
      notes: 'List agents then sandbox collaboration.',
    },
    {
      id: 'run-memory',
      name: 'Run → Memory',
      steps: ['run', 'memory'],
      notes: 'Sandbox run then persist agent memory.',
    },
    {
      id: 'schedule-message',
      name: 'Schedule → Message',
      steps: ['schedule', 'message'],
      notes: 'Schedule stub then sandbox messaging.',
    },
  ];
}

export function agentFabricVersions() {
  return [
    {
      id: 'router-v1',
      kind: 'router',
      version: 1,
      status: 'shipped',
      notes: 'Initial agent intent → Runtime route table.',
    },
    {
      id: 'pipeline-v1',
      kind: 'pipeline',
      version: 1,
      status: 'shipped',
      notes: 'Initial fabric pipeline catalog.',
    },
    {
      id: 'sandbox-facade-v1',
      kind: 'sandbox',
      version: 1,
      status: 'shipped',
      notes: 'Collaboration/schedule remain Runtime sandbox — fabric catalogs + façades only.',
    },
  ];
}

export function agentFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_agent_fabric',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'delegates_to_agent_runtime',
    eventDriven: 'optional_event_fabric_cloudevents',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiFabric: true,
    extendsAgentRuntime: true,
    regeneratesAgentRuntime: false,
    regeneratesVolumes1to9: false,
    customerFacingProduct: false,
    langGraphOs: false,
    autoGptOs: false,
    openToolExecution: false,
    liveToolExecution: false,
    sandboxed: true,
    policyRuntimeHardGate: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    note:
      'Agent Fabric. Router/discovery/collaborate/schedule façades over Agent Runtime. Sandboxed + Policy Runtime hard-gated.',
  };
}

export function agentFabricHonesty() {
  return {
    customerFacingProduct: false,
    langGraphOs: false,
    autoGptOs: false,
    openToolExecution: false,
    liveToolExecution: false,
    regeneratesAgentRuntime: false,
    regeneratesVolumes1to9: false,
    extendsAgentRuntime: true,
    sandboxed: true,
    policyRuntimeHardGate: true,
    crossWorkspaceSameOrgOnly: true,
    crossOrgDataPlane: false,
    optionalEventFabricPropagation: true,
    sseRealtimeTicks: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
  };
}
