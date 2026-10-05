# ADR-0041: Foundation model program deferred

- Status: Superseded for product routing by ADR-0298 (Own AI primary); SOTA-claim honesty retained
- Date: 2026-09-07
- Updated: 2026-10-03
- Phase: VL-112

## Context

Roadmap VL-112 asks for named foundation models (Atlas, Baobab, Echo, …). VerbaLab’s company posture is **own models** (VerbaLab Own AI), not renting peer platforms as the product default.

## Decision

1. **2026-10-03 (ADR-0298):** VL-112 / FM hubs are **active** as VerbaLab-owned model products. Gateway primary path is VerbaLab Own AI endpoints (`VERBALAB_*`). Weight binaries deploy as VerbaLab model services — not rented third-party AI vendors defaults.
2. **Honesty retained:** do not claim competitive SOTA without eval evidence against live VerbaLab endpoints.
3. **Historical note:** Earlier “do not start / buy vendors” posture applied before the own-model program was authorized.
4. Platform hubs (ADR-0135+) remain valid under owned-model serving.

## Consequences

- Executable roadmap through M11 is complete for a small team.
- Platform/MLOps scaffolding for Volume 9 is allowed under ADR-0135 honesty constraints.
- Marking VL-112 Done without weights and eval would still violate engineering standards (no fake completeness).
