export function agentIntelligenceHonesty() {
  return {
    agentRuntimeHub: true,
    voiceFaq: true,
    fullAgentOs: false,
    multiAgentOs: false,
    note:
      'Agent Intelligence is a hub over agent-runtime + voice FAQ. Full autonomous agent OS deferred.',
  };
}

export function agentIntelligenceCatalog() {
  return {
    id: 'agent-intelligence',
    title: 'Agent Intelligence',
    blurb:
      'Intelligence Cloud agent hub — routes to agent-runtime, voice FAQ, and orchestration pipelines. Not a full agent OS.',
    honesty: agentIntelligenceHonesty(),
    docs: '/docs/AGENT_INTELLIGENCE.md',
    routesTo: [
      { module: 'agent-runtime', path: '/agent-runtime', api: 'GET /v1/agent-runtime/engine' },
      { module: 'ai-orchestration', path: '/ai-orchestration', api: 'POST /v1/ai-orchestration/run' },
      { module: 'voice', path: '/voice', api: 'GET /v1/voice/products' },
      { module: 'partner-connectors', path: '/partner-connectors', api: 'POST /v1/partner-connectors/invoke' },
    ],
  };
}
