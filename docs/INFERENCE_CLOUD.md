# VerbaLab Inference Cloud

**Status:** Foundation + GPU Platform partial (VL-204–205 / library Phases 71–72); Volume 7 continues through VL-213  
**Rule:** Shared model runtime layer underneath AI Orchestration and every product cloud that calls a model. Extends **AI Gateway (VL-021)** + chat/embeddings. Do **not** regenerate Gateway, Intelligence, Knowledge, or invent a GPU hyperscaler / multi-region Inference OS. Follow the [12-layer Cloud Blueprint](./CLOUD_BLUEPRINT.md) (ADR-0080). Roadmap: [`docs/roadmap/volume7-inference-cloud/`](./roadmap/volume7-inference-cloud/).

Volumes 1–6 already ship Language, Speech, Voice, Intelligence, and Knowledge clouds. They call vendor models through the Gateway today — this volume layers a discoverable Inference hub without cloning those products.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Inference Cloud Foundation | **VL-204** — `/inference-cloud` + product catalog / overview |
| GPU Platform | **Partial** — **VL-205** `/gpu-platform` sandbox + hard ceilings; no cloud GPU APIs |
| Model Serving | **Deferred** — Phase 73 / VL-206 (vendor APIs via Gateway today) |
| AI Router | **Deferred** — Phase 74 / VL-207 |
| Streaming Runtime | **Partial** — existing chat/TTS SSE; dedicated product Phase 75 / VL-208 |
| Batch Runtime | **Partial** — BullMQ jobs; dedicated product Phase 76 / VL-209 |
| Intelligent Cache | **Deferred** — Phase 77 / VL-210 |
| Cost Optimization Engine | **Deferred** — Phase 78 / VL-211 (must enforce caps) |
| AI Runtime Analytics | **Deferred** — Phase 79 / VL-212 |
| Production Audit | Phase 80 / VL-213 |
| CPU Runtime | **Partial** — Nest + vendor HTTP adapters |
| Model Registry Integration | **Partial** — links `/models` (not regenerated) |
| Autoscaling / Multi Region | **Deferred** — hard ceilings; no open-ended GPU autoscale |
| GraphQL / CQRS | Bounded Inference Cloud catalog slice |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console hub | `/inference-cloud` |
| REST catalog | `GET /v1/inference-cloud/products` (public) |
| REST overview | `GET /v1/inference-cloud/overview` (Clerk session) |
| GraphQL | `inferenceProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `inferenceProducts()` on `@verbalab/sdk` |
| CLI | `verbalab inference-products` |
| GPU Platform | `/gpu-platform` · `GET /v1/gpu-platform/engine` (VL-205) |
| Existing Gateway | `/gateway` · VL-021 |
| Existing models | `/models` |

---

## Spend safety (README)

1. **Phase 72 / GPU Platform** — do not point at a production billing account without sandbox spend limits / budget alerts. Scaling must have a **hard ceiling** (max instances / max spend), not only a target.
2. **Phase 78 / Cost Optimization** — must **enforce** spend limits, not only report cost after the fact.
3. Compiling + green tests is **not** enough before connecting to a real cloud bill.

## Honesty

Inference Cloud is **not** a GPU hyperscaler, multi-region runtime OS, or replacement for the AI Gateway. It is a **bounded hub** that makes the shared model-runtime roadmap discoverable and schedules GPU/serving/router/cache/cost products with **spend-safety constraints from day one**. See ADR-0115.
