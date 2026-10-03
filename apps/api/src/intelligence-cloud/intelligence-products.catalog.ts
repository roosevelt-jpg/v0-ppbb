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
      api: 'GET /v1/embedding-cloud/engine',
      console: '/embedding-cloud',
      notes:
        'Text/document/code via VL-181 hub over VL-063. Speech/image/video/cross-modal deferred.',
    },
    {
      id: 'vector',
      name: 'Vector Cloud',
      status: 'partial',
      api: 'GET /v1/vector-cloud/engine',
      console: '/vector-cloud',
      notes:
        'pgvector hub VL-182 over VL-062 knowledge_chunks. Hybrid/sharding/Pinecone OS deferred.',
    },
    {
      id: 'memory',
      name: 'Memory Cloud',
      status: 'partial',
      api: 'GET /v1/memory-cloud/engine',
      console: '/memory-cloud',
      notes:
        'Persistent memory + GDPR export/erase (VL-183). Vector semantic memory + retention sweeper deferred.',
    },
    {
      id: 'knowledge-graph',
      name: 'Knowledge Graph Cloud',
      status: 'partial',
      api: 'GET /v1/knowledge-graph/engine',
      console: '/knowledge-graph',
      notes:
        'Bounded Postgres ER layer (VL-184). Prefer RAG. Neo4j/ontology/vertical packs deferred.',
    },
    {
      id: 'context-engine',
      name: 'Context Engine',
      status: 'partial',
      api: 'GET /v1/context-engine/engine',
      console: '/context-engine',
      notes:
        'Assembles retrieval + memory + prompt (VL-185). Char-budget compression; infinite window/realtime deferred.',
    },
    {
      id: 'reasoning',
      name: 'Reasoning Cloud',
      status: 'partial',
      api: 'GET /v1/reasoning-cloud/engine',
      console: '/reasoning-cloud',
      notes:
        'LLM-gateway strategies (VL-186). Not a custom reasoner kernel; shallow ToT; no tool execution.',
    },
    {
      id: 'recommendations',
      name: 'Recommendation Engine',
      status: 'partial',
      api: 'GET /v1/recommendation-engine/engine',
      console: '/recommendation-engine',
      notes:
        'Light rankers over languages/voices/knowledge (VL-187). Not a retail recommender OS.',
    },
    {
      id: 'prompt-intelligence',
      name: 'Prompt Intelligence',
      status: 'partial',
      api: 'GET /v1/prompt-intelligence/engine',
      console: '/prompt-intelligence',
      notes:
        'Hub over VL-086 versioned prompts (VL-188). Heuristic eval/security; not an auto-prompt research lab.',
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
