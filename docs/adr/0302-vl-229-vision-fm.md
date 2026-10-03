# ADR-0302: Vision FM (VL-229)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-229 / library Phase 96

## Context

VerbaLab owns its foundation model families. Vision FM (VerbaLab OCR / document vision FM) must be a first-class product surface, not a rented third-party model.

## Decision

1. Ship `vision-fm` hub with engine/capabilities/overview/monitoring.
2. Inference routes through VerbaLab Own AI gateway (`VERBALAB_*` endpoints).
3. Do not embed weight binaries in the monorepo; credentials/endpoints configured in deploy env.
4. `ownedModels=true`, `vendorRentalDefault=false`.

## Consequences

- Console `/ vision-fm` and API `/v1/vision-fm/*` are production-wired.
- Live quality depends on deployed VerbaLab model services + eval evidence.
