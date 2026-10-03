# ADR-0306: Fusion (VL-233)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-233 / library Phase 100

## Context

VerbaLab owns its foundation model families. Fusion (Multimodal fusion FM) must be a first-class product surface, not a rented third-party model.

## Decision

1. Ship `fusion` hub with engine/capabilities/overview/monitoring.
2. Inference routes through VerbaLab Own AI gateway (`VERBALAB_*` endpoints).
3. Do not embed weight binaries in the monorepo; credentials/endpoints configured in deploy env.
4. `ownedModels=true`, `vendorRentalDefault=false`.

## Consequences

- Console `/ fusion` and API `/v1/fusion/*` are production-wired.
- Live quality depends on deployed VerbaLab model services + eval evidence.
