# ADR-0274: Standards Analytics

## Status

Accepted - Volume 22 Phase 239 (VL-372).

## Context

VGAS is VerbaLab's own standards/certification platform software. It is not external ISO/IEEE/W3C adoption.

## Decision

Ship `standards-analytics` with Nest catalogs, Prisma `VgasRecord` persistence, honesty flags, console UI, and GraphQL/OpenAPI/SDK/CLI discovery.

## Consequences

Runnable internal/standards product tooling. Certificates are VerbaLab-issued only (`thirdPartyAccreditation=false`).
