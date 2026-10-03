# VerbaLab Intelligence Cloud

**Status:** Foundation shipped (VL-180 / library Phase 47)  
**Rule:** Shared intelligence layer over the LLM gateway, embeddings, and RAG. Extend existing Chat / Embeddings / Knowledge modules. Do not regenerate Language/Speech/Voice Clouds. Do **not** invent a custom AI kernel or reasoner OS. Follow the [12-layer Cloud Blueprint](./CLOUD_BLUEPRINT.md) (ADR-0080).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Intelligence Cloud Foundation | **VL-180** — `/intelligence-cloud` + product catalog / overview |
| Embedding Cloud | **Partial** — VL-063 `POST /v1/embeddings` (text); multimodal deferred (VL-181) |
| Vector Cloud | **Partial** — pgvector in VL-062 Knowledge; dedicated vector DB deferred (VL-182) |
| Memory Cloud | **Deferred** — VL-183 (must include GDPR delete/export) |
| Knowledge Graph Cloud | **Deferred** — VL-184; use RAG until then |
| Context Engine | **Deferred** — VL-185 |
| Reasoning Cloud | **Deferred** — VL-186 via LLM prompts, not a custom reasoner |
| Recommendation Engine | **Deferred** — VL-187 |
| Prompt Intelligence | **Partial** — platform prompt versioning; hub VL-188 |
| AI Decision Engine | **Deferred** — VL-189 |
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
