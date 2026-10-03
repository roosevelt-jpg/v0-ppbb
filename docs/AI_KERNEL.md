# VerbaLab AI Kernel

**Status:** Foundation shipped (VL-214 / library Phase 81); Volume 8 continues through VL-223  
**Rule:** The AI Kernel is the **internal** execution layer — **not** a customer-facing product. Extends Inference Cloud + existing Memory/Prompt/Context/Reasoning/Orchestration modules. Do **not** regenerate Volumes 1–7 or invent a Linux/VAIOS rewrite. Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

Volumes 1–7 already ship Identity, Gateway, product clouds, Intelligence, Knowledge, and Inference. They execute through Nest + Gateway today — this volume layers a discoverable **kernel hub** for future runtimes without cloning those products.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| AI Kernel Foundation | **VL-214** — `/ai-kernel` + runtime catalog / overview |
| Memory Runtime | **Partial** — Phase 82 / VL-215 ([`MEMORY_RUNTIME.md`](./MEMORY_RUNTIME.md); extends Memory Cloud) |
| Prompt Runtime | **Partial** — Phase 83 / VL-216 ([`PROMPT_RUNTIME.md`](./PROMPT_RUNTIME.md); extends Prompt Intelligence) |
| Context Runtime | **Deferred** — Phase 84 / VL-217 |
| Reasoning Runtime | **Deferred** — Phase 85 / VL-218 |
| Agent Runtime | **Deferred** — Phase 86 / VL-219 (must sandbox + scope permissions) |
| Workflow Runtime | **Deferred** — Phase 87 / VL-220 (must sandbox + scope permissions) |
| Plugin Runtime | **Deferred** — Phase 88 / VL-221 (must sandbox + scope permissions) |
| Policy Runtime | **Deferred** — Phase 89 / VL-222 (must **hard-gate**, not log-only) |
| Production Audit | Phase 90 / VL-223 |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console (internal) | `/ai-kernel` |
| Memory Runtime | `/memory-runtime` + `GET /v1/memory-runtime/engine` |
| Prompt Runtime | `/prompt-runtime` + `GET /v1/prompt-runtime/engine` |
| REST catalog | `GET /v1/ai-kernel/products` (public) |
| REST engine | `GET /v1/ai-kernel/engine` |
| REST overview | `GET /v1/ai-kernel/overview` (Clerk session) |
| Monitoring | `GET /v1/ai-kernel/monitoring` |
| GraphQL | `aiKernelRuntimes` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `aiKernelProducts()` on `@verbalab/sdk` |
| CLI | `verbalab ai-kernel-products` |

## Action safety (README)

1. **Agent / Workflow / Plugin (Phases 86–88)** — must have scoped permissions and sandboxing; not open function calls against real accounts/data.
2. **Policy Runtime (Phase 89)** — must be a **hard gate** wired into those runtimes (requests blocked), not log/flag-only decoration.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `linuxOsRewrite` | false |
| `vaiosOs` | false |
| `regeneratesVolumes1to7` | false |
| `hexagonalRewrite` | false |
| `agentActionBoundariesRequired` | true |
| `policyHardGateRequired` | true |

See ADR-0125.
