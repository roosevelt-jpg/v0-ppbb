# ADR-0303: Vector FM (VL-230)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-230 / library Phase 97

## Context

VerbaLab owns its foundation model families. Vector FM (VerbaLab embeddings FM) must be a first-class product surface, not a rented third-party model.

## Decision

1. Ship `vector-fm` hub with engine/capabilities/overview/monitoring.
2. Inference routes through VerbaLab Own AI gateway (`VERBALAB_*` endpoints).
3. Do not embed weight binaries in the monorepo; credentials/endpoints configured in deploy env.
4. `ownedModels=true`, `vendorRentalDefault=false`.

## Consequences

- Console `/ vector-fm` and API `/v1/vector-fm/*` are production-wired.
- Live quality depends on deployed VerbaLab model services + eval evidence.
