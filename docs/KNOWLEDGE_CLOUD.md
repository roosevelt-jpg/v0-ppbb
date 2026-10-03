# VerbaLab Knowledge Cloud

**Status:** Foundation through Ontology partial (VL-193–196 / library Phases 60–63); Volume 6 continues through VL-203  
**Rule:** Enterprise knowledge layer over VL-062 RAG and Intelligence Cloud (embeddings, vectors, knowledge graph, context). Extend existing Knowledge / Vector / Graph modules. Do **not** regenerate Intelligence Cloud or invent a Confluence/SharePoint/ontology OS. Follow the [12-layer Cloud Blueprint](./CLOUD_BLUEPRINT.md) (ADR-0080). Roadmap: [`docs/roadmap/volume6-knowledge-cloud/`](./roadmap/volume6-knowledge-cloud/).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Knowledge Cloud Foundation | **VL-193** — `/knowledge-cloud` + product catalog / overview |
| Enterprise Knowledge Base | **Partial** — **VL-194** `/knowledge-base` over VL-062; org/workspace-scoped; media/approval deferred |
| Enterprise Search | **Partial** — **VL-195** `/enterprise-search`; keyword/semantic/light hybrid; not Elastic OS |
| Ontology Platform | **Partial** — **VL-196** `/ontology` over VL-184 KG; not OWL/Protege OS |
| Taxonomy Platform | **Deferred** — Phase 64 / VL-197 |
| Enterprise RAG Platform | **Partial** — VL-062 `/knowledge` + Vector/Context; full product Phase 65 / VL-198 |
| Knowledge Memory | **Deferred** — Phase 66 / VL-199 (≠ Intelligence Memory Cloud VL-183) |
| Knowledge Intelligence | **Deferred** — Phase 67 / VL-200 |
| Enterprise Knowledge APIs | **Partial** — existing `/v1/knowledge/*`; pack Phase 68 / VL-201 |
| Knowledge Analytics | **Deferred** — Phase 69 / VL-202 |
| Production Audit | Phase 70 / VL-203 |
| Knowledge Graph | Linked VL-184 — not regenerated as this cloud |
| GraphQL / CQRS | Bounded Knowledge Cloud catalog slice |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console hub | `/knowledge-cloud` |
| REST catalog | `GET /v1/knowledge-cloud/products` (public) |
| REST overview | `GET /v1/knowledge-cloud/overview` (Clerk session) |
| GraphQL | `knowledgeProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `knowledgeProducts()` on `@verbalab/sdk` |
| CLI | `verbalab knowledge-products` |
| Existing RAG | `/knowledge` · `POST /v1/knowledge/query` (VL-062) |
| Knowledge Base | `/knowledge-base` · `GET /v1/knowledge-base/engine` (VL-194) |
| Enterprise Search | `/enterprise-search` · `POST /v1/enterprise-search/search` (VL-195) |
| Ontology | `/ontology` · `GET /v1/ontology/engine` (VL-196) |

---

## Honesty

Knowledge Cloud is **not** an enterprise knowledge OS, ontology platform, or Neo4j knowledge-graph suite. It is a **bounded hub** that makes VL-062 RAG and related Intelligence surfaces discoverable and schedules KB / search / ontology / taxonomy / enterprise RAG / knowledge memory products with **tenant-scoped access from day one** (Phase 61). It maps onto existing **VL-062** knowledge/RAG (pgvector), **VL-063** embeddings, and Intelligence Cloud hubs — it does **not** regenerate those surfaces. See ADR-0104.

## Constraints carried forward (README)

1. **Phase 61 / Enterprise Knowledge Base** — access controls must be org/workspace-scoped from the first ingestion path (classic cross-tenant leak risk).
2. **Phase 65 / Enterprise RAG** — do not trust green unit tests alone; hand-check retrieved context on real documents and known-answer questions.
