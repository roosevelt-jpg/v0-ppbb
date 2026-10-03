# VerbaLab Intelligence Cloud

**Status:** Foundation shipped (VL-180 / library Phase 47)  
**Rule:** Shared intelligence layer over the LLM gateway, embeddings, and RAG. Extend existing Chat / Embeddings / Knowledge modules. Do not regenerate Language/Speech/Voice Clouds. Do **not** invent a custom AI kernel or reasoner OS. Follow the [12-layer Cloud Blueprint](./CLOUD_BLUEPRINT.md) (ADR-0080).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Intelligence Cloud Foundation | **VL-180** — `/intelligence-cloud` + product catalog / overview |
| Embedding Cloud | **Partial** — **VL-181** `/embedding-cloud` over VL-063 text; multimodal deferred |
| Vector Cloud | **Partial** — **VL-182** `/vector-cloud` over VL-062 pgvector; hybrid/Pinecone OS deferred |
| Memory Cloud | **Partial** — **VL-183** `/memory-cloud` + GDPR export/erase; semantic NN + sweeper deferred |
| Knowledge Graph Cloud | **Partial** — **VL-184** `/knowledge-graph` bounded ER; Neo4j/ontology/verticals deferred; prefer RAG |
| Context Engine | **Partial** — **VL-185** `/context-engine` assemble; char-budget compression; infinite/realtime deferred |
| Reasoning Cloud | **Partial** — **VL-186** `/reasoning-cloud` LLM strategies; not a custom reasoner kernel |
| Recommendation Engine | **Partial** — **VL-187** `/recommendation-engine` light rankers; not retail recommender OS |
| Prompt Intelligence | **Partial** — **VL-188** `/prompt-intelligence` over VL-086; not auto-prompt research lab |
| AI Decision Engine | **Partial** — **VL-189** `/decision-engine` light rules; not Drools/Pega BRMS |
| AI Orchestration | **Partial** — VL-060 chat/gateway; product VL-190 |
| Intelligence Analytics | **Deferred** — VL-191 |
| Production Audit | Phase 59 (VL-192) |
| GraphQL / CQRS | Bounded Intelligence Cloud catalog slice |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console hub | `/intelligence-cloud` |
| REST catalog | `GET /v1/intelligence-cloud/products` (public) |
| REST overview | `GET /v1/intelligence-cloud/overview` (Clerk session) |
| GraphQL | `intelligenceProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `intelligenceProducts()` on `@verbalab/sdk` |
| CLI | `verbalab intelligence-products` |

---

## Honesty

Intelligence Cloud is **not** a custom AI kernel, LangGraph OS, or enterprise knowledge-graph platform. It is a **bounded hub** that makes embeddings/RAG/chat discoverable and schedules later memory/orchestration products with GDPR and load-bearing orchestration constraints. See ADR-0091.
