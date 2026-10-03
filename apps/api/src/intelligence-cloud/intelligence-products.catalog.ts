export type IntelligenceProductStatus = 'shipped' | 'partial' | 'deferred';

export type IntelligenceProductRow = {
  id: string;
  name: string;
  status: IntelligenceProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 47 product map (VL-180). Hub only — maps onto LLM gateway + embeddings + RAG. */
export function intelligenceProductCatalog(): IntelligenceProductRow[] {
  return [
    {
      id: 'intelligence',
      name: 'VerbaLab Intelligence Cloud',
      status: 'shipped',
      api: 'GET /v1/intelligence-cloud/products',
      console: '/intelligence-cloud',
      notes:
        'Intelligence Cloud parent hub (VL-180). Shared reasoning/memory/orchestration layer over LLM gateway — not a custom AI kernel.',
    },
    {
      id: 'embeddings',
      name: 'Embedding Cloud',
      status: 'partial',
      api: 'POST /v1/embeddings',
      console: '/knowledge',
      notes:
        'Text embeddings via gateway (VL-063). Speech/image/video/cross-modal deferred to VL-181 productization.',
    },
    {
      id: 'vector',
      name: 'Vector Cloud',
      status: 'partial',
      api: 'POST /v1/knowledge/query',
      console: '/knowledge',
      notes: 'pgvector retrieval in Knowledge/RAG (VL-062). Dedicated vector DB deferred (VL-182).',
    },
    {
      id: 'memory',
      name: 'Memory Cloud',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Persistent cross-session memory + GDPR delete/export — VL-183. Not shipped.',
    },
    {
      id: 'knowledge-graph',
      name: 'Knowledge Graph Cloud',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Entity/relationship graph OS deferred (VL-184). Use RAG (VL-062) until then.',
    },
    {
      id: 'context-engine',
      name: 'Context Engine',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Context assembly for AI requests — VL-185.',
    },
    {
      id: 'reasoning',
      name: 'Reasoning Cloud',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Multi-step reasoning via LLM gateway prompts — VL-186. Not a custom reasoner kernel.',
    },
    {
      id: 'recommendations',
      name: 'Recommendation Engine',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Recommendations over embeddings/memory — VL-187.',
    },
    {
      id: 'prompt-intelligence',
      name: 'Prompt Intelligence',
      status: 'partial',
      api: null,
      console: null,
      notes: 'Versioned prompts exist for chat/RAG (platform). Product hub VL-188.',
    },
    {
      id: 'decision-engine',
      name: 'AI Decision Engine',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Decision-making logic layer — VL-189. Not an enterprise rules OS.',
    },
    {
      id: 'orchestration',
      name: 'AI Orchestration',
      status: 'partial',
      api: 'POST /v1/chat/completions',
      console: '/chat',
      notes:
        'Gateway-backed chat/compose paths today (VL-060). Load-bearing orchestration product — VL-190.',
    },
    {
      id: 'agent-intelligence',
      name: 'Agent Intelligence',
      status: 'partial',
      api: null,
      console: null,
      notes: 'Existing agent surfaces (e.g. voice FAQ). Full agent OS deferred.',
    },
    {
      id: 'intelligence-analytics',
      name: 'Intelligence Analytics',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Usage/quality analytics for this cloud — VL-191. Distinct from Language/Speech/Voice analytics.',
    },
    {
      id: 'ai-observability',
      name: 'AI Observability',
      status: 'partial',
      api: 'GET /health',
      console: null,
      notes: 'Shared request IDs + audits (VL-070). Intelligence-specific dashboards deferred.',
    },
  ];
}

export function intelligenceArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_intelligence_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    rest: true,
    graphql: true,
    realtime: true,
    streaming: true,
    batch: true,
    enterpriseApis: true,
    sdk: '@verbalab/sdk',
    cli: '@verbalab/cli',
    docker: true,
    terraform: true,
    kubernetes: true,
    primaryRegion: 'af-south-1',
    deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    billing: true,
    monitoring: true,
    customAiKernel: false,
    llmGateway: true,
    pgvector: true,
  };
}
