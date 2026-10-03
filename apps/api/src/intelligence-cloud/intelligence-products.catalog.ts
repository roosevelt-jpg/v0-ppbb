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
        'Intelligence Cloud parent hub. Shared reasoning/memory/orchestration layer over LLM gateway — not a custom AI kernel.',
    },
    {
      id: 'embeddings',
      name: 'Embedding Cloud',
      status: 'shipped',
      api: 'GET /v1/embedding-cloud/engine',
      console: '/embedding-cloud',
      notes:
        'Shipped text/document/code embeddings over Own AI/gateway; speech/image via caption→embed path. Dedicated multimodal encoders deferred.',
    },
    {
      id: 'vector',
      name: 'Vector Cloud',
      status: 'shipped',
      api: 'GET /v1/vector-cloud/engine',
      console: '/vector-cloud',
      notes:
        'Shipped pgvector hub + hybrid search over Sharding/Pinecone OS deferred.',
    },
    {
      id: 'memory',
      name: 'Memory Cloud',
      status: 'shipped',
      api: 'GET /v1/memory-cloud/engine',
      console: '/memory-cloud',
      notes:
        'Shipped persistent memory + GDPR export/erase + retention sweeper. Embedding NN semantic memory deferred.',
    },
    {
      id: 'knowledge-graph',
      name: 'Knowledge Graph Cloud',
      status: 'shipped',
      api: 'GET /v1/knowledge-graph/engine',
      console: '/knowledge-graph',
      notes:
        'Shipped bounded Postgres ER. Prefer RAG. Neo4j OS deferred; ontology/taxonomy are sibling hubs.',
    },
    {
      id: 'context-engine',
      name: 'Context Engine',
      status: 'shipped',
      api: 'GET /v1/context-engine/engine',
      console: '/context-engine',
      notes:
        'Shipped assemble retrieval + memory + prompt with char-budget compression. Infinite window/realtime deferred.',
    },
    {
      id: 'reasoning',
      name: 'Reasoning Cloud',
      status: 'shipped',
      api: 'GET /v1/reasoning-cloud/engine',
      console: '/reasoning-cloud',
      notes:
        'Shipped LLM-gateway strategies + allowlisted tool execution. Not a custom reasoner kernel.',
    },
    {
      id: 'recommendations',
      name: 'Recommendation Engine',
      status: 'shipped',
      api: 'GET /v1/recommendation-engine/engine',
      console: '/recommendation-engine',
      notes:
        'Shipped light rankers over languages/voices/knowledge. Not a retail recommender OS.',
    },
    {
      id: 'prompt-intelligence',
      name: 'Prompt Intelligence',
      status: 'shipped',
      api: 'GET /v1/prompt-intelligence/engine',
      console: '/prompt-intelligence',
      notes:
        'Shipped hub over versioned prompts with heuristic eval/security. Not an auto-prompt research lab.',
    },
    {
      id: 'decision-engine',
      name: 'AI Decision Engine',
      status: 'shipped',
      api: 'GET /v1/decision-engine/engine',
      console: '/decision-engine',
      notes:
        'Shipped bounded policy/routing helpers. Not Drools/Pega BRMS.',
    },
    {
      id: 'orchestration',
      name: 'AI Orchestration',
      status: 'shipped',
      api: 'GET /v1/ai-orchestration/engine',
      console: '/ai-orchestration',
      notes:
        'Shipped load-bearing e2e pipelines over gateway/engines. Not a multi-cloud agent OS.',
    },
    {
      id: 'agent-intelligence',
      name: 'Agent Intelligence',
      status: 'shipped',
      api: 'GET /v1/agent-intelligence/engine',
      console: '/agent-intelligence',
      notes: 'Shipped Agent Intelligence hub over agent-runtime + voice FAQ. Full agent OS deferred.',
    },
    {
      id: 'intelligence-analytics',
      name: 'Intelligence Analytics',
      status: 'shipped',
      api: 'GET /v1/intelligence-analytics/engine',
      console: '/intelligence-analytics',
      notes:
        'Shipped usage/quality aggregates for Intelligence Cloud. Not BI OS.',
    },
    {
      id: 'ai-observability',
      name: 'AI Observability',
      status: 'shipped',
      api: 'GET /v1/ai-observability/engine',
      console: '/ai-observability',
      notes: 'Shipped AI Observability hub over request IDs, audits, health, and product monitoring. APM/Datadog OS deferred.',
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
