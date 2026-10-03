# ADR-0273: Global Partner Program

## Status

Accepted - Volume 22 Phase 238 (VL-371).

## Context

VGAS is VerbaLab's own standards/certification platform software. It is not external ISO/IEEE/W3C adoption.

## Decision

Ship `global-partner-program` with Nest catalogs, Prisma `VgasRecord` persistence, honesty flags, console UI, and GraphQL/OpenAPI/SDK/CLI discovery.

## Consequences

Runnable internal/standards product tooling. Certificates are VerbaLab-issued only (`thirdPartyAccreditation=false`).
