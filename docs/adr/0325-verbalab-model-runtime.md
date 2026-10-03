# ADR-0325 — VerbaLab Model Runtime (honesty closeout)

## Status

Accepted — 2026-10-03

## Context

Own AI gateway (ADR-0298) and model keys (ADR-0324) made VerbaLab the primary inference path, but three honesty gaps remained:

1. No in-process model runtime when remote pods were absent (only fixtures / unconfigured).
2. No African quality evidence vs English-centric baselines.
3. Gov / bank / hospital verticals stayed demo-locked without an explicit production unlock path.

## Decision

Ship `/model-runtime` with:

1. **Local Own AI runtime** — African linguistic engine in-process; Gateway MT uses it when HTTP pods are unset (`VERBALAB_LOCAL_MODEL_RUNTIME` default on).
2. **Deploy shape** — `VERBALAB_WEIGHTS_URL` / `VERBALAB_MODEL_BASE_URL` swap lexicon decode for neural/HTTP decode without API changes. Weight binaries stay out of git.
3. **African quality eval** — exact-match harness on owned lexicon packs vs a weak vendor baseline stub. SOTA claims forbidden.
4. **Enterprise unlocks** — checklist gates for `government` / `banking` / `hospital` (residency, audit, DPA/BAA, clinical safety, no vendor fallback).

## Consequences

- Honest product claims: local Own AI MT, measured African lexicon win-rate, gated high-stakes unlocks.
- Neural competitive weights remain a deploy artifact, not a monorepo claim.
- Console hub: `/model-runtime`. APIs under `/v1/model-runtime/*`.
