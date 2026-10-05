# ADR-0307: Translate FM (VL-234)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-234 / library Phase 101

## Context

VerbaLab owns its foundation model families. Translate FM (VerbaLab African MT foundation model) must be a first-class product surface, not a rented third-party model.

## Decision

1. Ship `translate-fm` hub with engine/capabilities/overview/monitoring.
2. Inference routes through VerbaLab Own AI gateway (`VERBALAB_*` endpoints).
3. Do not embed weight binaries in the monorepo; credentials/endpoints configured in deploy env.
4. `ownedModels=true`, `vendorRentalDefault=false`.

## Consequences

- Console `/ translate-fm` and API `/v1/translate-fm/*` are production-wired.
- Live quality depends on deployed VerbaLab model services + eval evidence.
