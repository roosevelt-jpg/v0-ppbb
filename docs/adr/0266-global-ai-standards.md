# ADR-0266: Global AI Standards

## Status

Accepted - Volume 22 Phase 231 (VL-364).

## Context

VGAS is VerbaLab's own standards/certification platform software. It is not external ISO/IEEE/W3C adoption.

## Decision

Ship `global-ai-standards` with Nest catalogs, Prisma `VgasRecord` persistence, honesty flags, console UI, and GraphQL/OpenAPI/SDK/CLI discovery.

## Consequences

Runnable internal/standards product tooling. Certificates are VerbaLab-issued only (`thirdPartyAccreditation=false`).
