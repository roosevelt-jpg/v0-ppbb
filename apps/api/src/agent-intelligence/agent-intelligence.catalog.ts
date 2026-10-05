export function agentIntelligenceHonesty() {
  return {
    agentRuntimeHub: true,
    voiceFaq: true,
    fullAgentOs: true,
    multiAgentOs: true,
    note:
      'Agent Intelligence hub ships full Agent OS via GET /v1/agent-os/engine and POST /v1/agent-os/run (agent-operating-system façade over runtime/fabric/orchestration).',
  };
}

export function agentIntelligenceCatalog() {
  return {
    id: 'agent-intelligence',
    title: 'Agent Intelligence',
    blurb:
      'Intelligence Cloud agent hub — agent-runtime, voice FAQ, orchestration, partner MCP tools, and the full Agent OS run surface.',
    honesty: agentIntelligenceHonesty(),
    docs: '/docs/AGENT_INTELLIGENCE.md',
    routesTo: [
      { module: 'agent-os', path: '/agent-intelligence', api: 'GET /v1/agent-os/engine' },
      { module: 'agent-runtime', path: '/agent-runtime', api: 'GET /v1/agent-runtime/engine' },
      { module: 'ai-orchestration', path: '/ai-orchestration', api: 'POST /v1/ai-orchestration/run' },
      { module: 'voice', path: '/voice', api: 'GET /v1/voice/products' },
      { module: 'partner-connectors', path: '/partner-connectors', api: 'POST /v1/partner-connectors/invoke' },
      {
        module: 'agent-operating-system',
        path: '/agent-operating-system',
        api: 'GET /v1/agent-operating-system/engine',
      },
    ],
  };
}
