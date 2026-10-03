# ADR-0264: Corporate Risk Platform

## Status

Accepted — Volume 21 Phase 229 (VL-362).

## Context

VerbaLab needs internal tooling for how the company runs (governance tracking, strategy,
portfolio, architecture, knowledge, executive KPIs, risk). README Volume 21 is explicit:
this is software that *supports* processes, not a replacement for a real board or counsel.

## Decision

Ship `corporate-risk-platform` as a Nest catalog + Prisma `VcosRecord` domain surface with honesty flags,
console UI, GraphQL/OpenAPI/SDK/CLI discovery, and seeded African-AI-company sample records.

## Consequences

- Runnable internal tooling for local review via `/dev-login`.
- No claim of real corporate governance, legal counsel, or executive judgment.
- Extends EES (Vol 20) and AI Governance (Vol 15) via `routesTo` links.
