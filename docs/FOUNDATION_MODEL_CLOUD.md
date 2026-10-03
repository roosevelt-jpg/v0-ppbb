# VerbaLab Foundation Model Cloud

**Status:** Foundation hub shipped (VL-224 / library Phase 91)  
**Rule:** This volume ships **platform/MLOps scaffolding** — **not** trained competitive foundation weights. Extends Inference Cloud + AI Kernel. Do **not** regenerate Volumes 1–8 or claim OpenAI replacement. Roadmap: [`docs/roadmap/volume9-foundation-model-cloud/`](./roadmap/volume9-foundation-model-cloud/).

Volume 9 README is explicit: Cursor can write training pipelines, evaluation harnesses, registries, and orchestration. It cannot train Atlas/Baobab/etc. without real datasets, GPU clusters, and a research team.

ADR-0041 deferred the *training program* (VL-112). VL-224 **re-opens only the honest platform hub** — catalogs + deferred scaffolds — without fake completeness on weights.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Foundation Model Cloud Foundation | **VL-224** — `/foundation-model-cloud` + product catalog / overview |
| Atlas … Translate (Phases 92–101) | **Deferred** scaffolds in catalog — no trained weights |
| Model Training Platform (Phase 102) | **Partial** — VL-235 ([`MODEL_TRAINING_PLATFORM.md`](./MODEL_TRAINING_PLATFORM.md)); over VL-111 |
| Model Evaluation Platform (Phase 103) | **Deferred** — high-value MLOps track |
| Model Registry (Phase 104) | **Deferred** — extends existing VL-110 registry concepts |
| Production Audit (Phase 105) | Later — **VL-238** |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/foundation-model-cloud` |
| REST catalog | `GET /v1/foundation-model-cloud/products` (public) |
| REST engine | `GET /v1/foundation-model-cloud/engine` |
| REST overview | `GET /v1/foundation-model-cloud/overview` (Clerk session) |
| Monitoring | `GET /v1/foundation-model-cloud/monitoring` |
| GraphQL | `foundationModelCloudProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `foundationModelCloudProducts()` on `@verbalab/sdk` |
| CLI | `verbalab foundation-model-cloud-products` |

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | true (discovery hub) |
| `trainsCompetitiveFoundationWeights` | false |
| `shipsTrainedAtlasBaobabEtc` | false |
| `openAiReplacementOs` | false |
| `regeneratesVolumes1to8` | false |
| `mLOpsPlatformShipped` | false (hub only; Training/Eval/Registry deferred) |
| `hexagonalRewrite` | false |
| `modelFamilyScaffoldCatalog` | true |

See ADR-0135.
