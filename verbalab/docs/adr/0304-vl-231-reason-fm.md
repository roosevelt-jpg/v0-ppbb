# ADR-0304: Reason FM (VL-231)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-231 / library Phase 98

## Context

VerbaLab owns its foundation model families. Reason FM (VerbaLab reasoning specialist) must be a first-class product surface, not a rented third-party model.

## Decision

1. Ship `reason-fm` hub with engine/capabilities/overview/monitoring.
2. Inference routes through VerbaLab Own AI gateway (`VERBALAB_*` endpoints).
3. Do not embed weight binaries in the monorepo; credentials/endpoints configured in deploy env.
4. `ownedModels=true`, `vendorRentalDefault=false`.

## Consequences

- Console `/ reason-fm` and API `/v1/reason-fm/*` are production-wired.
- Live quality depends on deployed VerbaLab model services + eval evidence.
