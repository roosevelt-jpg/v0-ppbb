# ADR-0301: Voice FM (VL-228)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-228 / library Phase 95

## Context

VerbaLab owns its foundation model families. Voice FM (VerbaLab neural TTS + cloning FM) must be a first-class product surface, not a rented third-party model.

## Decision

1. Ship `voice-fm` hub with engine/capabilities/overview/monitoring.
2. Inference routes through VerbaLab Own AI gateway (`VERBALAB_*` endpoints).
3. Do not embed weight binaries in the monorepo; credentials/endpoints configured in deploy env.
4. `ownedModels=true`, `vendorRentalDefault=false`.

## Consequences

- Console `/ voice-fm` and API `/v1/voice-fm/*` are production-wired.
- Live quality depends on deployed VerbaLab model services + eval evidence.
