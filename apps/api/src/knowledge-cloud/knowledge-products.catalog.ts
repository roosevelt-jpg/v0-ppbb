export type KnowledgeProductStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeProductRow = {
  id: string;
  name: string;
  status: KnowledgeProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 60 product map (VL-193). Hub only — maps onto VL-062 RAG + Intelligence surfaces. */
export function knowledgeProductCatalog(): KnowledgeProductRow[] {
  return [
    {
      id: 'knowledge-cloud',
      name: 'VerbaLab Knowledge Cloud',
      status: 'shipped',
      api: 'GET /v1/knowledge-cloud/products',
      console: '/knowledge-cloud',
      notes:
        'Knowledge Cloud parent hub (VL-193). Enterprise knowledge products over VL-062 RAG + Intelligence — not a Confluence/SharePoint OS or Neo4j knowledge-graph platform.',
    },
    {
      id: 'enterprise-knowledge-base',
      name: 'Enterprise Knowledge Base',
      status: 'shipped',
      api: 'GET /v1/knowledge-base/engine',
      console: '/knowledge-base',
      notes:
        'Shipped org/workspace ingest over VL-062 (VL-194): collections/tags/MD/HTML + light approval. Not Confluence OS; deep media CMS deferred.',
    },
    {
      id: 'enterprise-search',
      name: 'Enterprise Search',
      status: 'shipped',
      api: 'GET /v1/enterprise-search/engine',
      console: '/enterprise-search',
      notes:
        'Shipped keyword + semantic + hybrid RRF (VL-195). Extends VL-062/Vector Cloud. Not Elastic/BM25 OS; image/voice search deferred.',
    },
    {
      id: 'ontology-platform',
      name: 'Ontology Platform',
      status: 'shipped',
      api: 'GET /v1/ontology/engine',
      console: '/ontology',
      notes:
        'Shipped concepts/hierarchies/synonyms over VL-184 KG (VL-196). Not OWL/Protege OS; certified vertical packs deferred.',
    },
    {
      id: 'taxonomy-platform',
      name: 'Taxonomy Platform',
      status: 'shipped',
      api: 'GET /v1/taxonomy/engine',
      console: '/taxonomy',
      notes:
        'Shipped categories/tags/trees + doc assign + heuristic classify (VL-197). Not enterprise taxonomy OS; ML auto-class OS deferred.',
    },
    {
      id: 'enterprise-rag',
      name: 'Enterprise RAG Platform',
      status: 'shipped',
      api: 'GET /v1/enterprise-rag/engine',
      console: '/enterprise-rag',
      notes:
        'Shipped retrieve/chunk/cite/grounded query over VL-062 + hybrid search (VL-198). Not LangChain OS; hand-verify still recommended.',
    },
    {
      id: 'knowledge-memory',
      name: 'Knowledge Memory',
      status: 'shipped',
      api: 'GET /v1/knowledge-memory/engine',
      console: '/knowledge-memory',
      notes:
        'Shipped knowledge-layer memory over VL-183 (VL-199): org/workspace/user/conversation/AI + evolve/versions. Not Mem0 OS.',
    },
    {
      id: 'knowledge-intelligence',
      name: 'Knowledge Intelligence',
      status: 'shipped',
      api: 'GET /v1/knowledge-intelligence/engine',
      console: '/knowledge-intelligence',
      notes:
        'Shipped discovery/link/recommend/validate/duplicates/confidence heuristics (VL-200). Not BI/Palantir OS.',
    },
    {
      id: 'enterprise-knowledge-apis',
      name: 'Enterprise Knowledge APIs',
      status: 'shipped',
      api: 'GET /v1/knowledge-apis/engine',
      console: '/knowledge-apis',
      notes:
        'Shipped public API pack (VL-201): REST/GraphQL/OpenAPI/SDK/CLI/webhooks/SSE. Not gRPC/Kafka/SDK-generator OS.',
    },
    {
      id: 'knowledge-analytics',
      name: 'Knowledge Analytics',
      status: 'shipped',
      api: 'GET /v1/knowledge-analytics/engine',
      console: '/knowledge-analytics',
      notes:
        'Shipped growth/usage/quality/search/gaps/confidence/relationships analytics (VL-202). Not BI OS.',
    },
    {
      id: 'knowledge-graph-bridge',
      name: 'Knowledge Graph (Intelligence)',
      status: 'shipped',
      api: 'GET /v1/knowledge-graph/engine',
      console: '/knowledge-graph',
      notes:
        'Shipped bounded ER bridge from VL-184 — linked, not regenerated. Prefer RAG; Neo4j OS deferred.',
    },
    {
      id: 'document-intelligence',
      name: 'Document Intelligence',
      status: 'shipped',
      api: 'POST /v1/knowledge/documents',
      console: '/knowledge',
      notes: 'Shipped upload/chunk/embed via VL-062 + Own AI OCR caption path. Layout/table doc-AI OS deferred.',
    },
  ];
}

export function knowledgeArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_knowledge_cloud_hub',
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
    enterpriseKnowledgeOs: false,
    ontologyOs: false,
    regeneratesVl062: false,
    extendsVl062: true,
    extendsIntelligenceCloud: true,
    tenantScopedKnowledge: true,
    pgvector: true,
    neo4jParity: false,
  };
}
