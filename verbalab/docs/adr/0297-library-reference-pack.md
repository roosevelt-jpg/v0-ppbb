# ADR-0297 — Library reference pack (index / risks / vision)

## Status

Accepted — post Volume 24 reference pack.

## Context

After Volume 24 closed the v2.0 phase-broken roadmap, the source library still
has a master index, deeper risk notes, and raw “AI Internet / beyond” commentary
without per-phase Cursor specs.

## Decision

1. Install the three documents under `docs/library-reference/`.
2. Ship a thin **Library Reference** console + API that exposes:
   - master phase index (machine-readable)
   - deeper risk notes summary
   - AI Internet vision as **deferred / non-executable**
3. Honesty flags:
   - `libraryIndexOnly=true`
   - `aiInternetExecutablePhases=false`
   - `missionControlOs=false`
   - `visionMarkedDoneWithoutSpec=false`

## Consequences

Operators can browse the full library map and risk areas without inventing
Phases 261–300. Pivot remains execution on bounded contexts already shipped.
