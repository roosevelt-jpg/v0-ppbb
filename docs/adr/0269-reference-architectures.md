# ADR-0269: Reference Architectures

## Status

Accepted - Volume 22 Phase 234 (VL-367).

## Context

VGAS is VerbaLab's own standards/certification platform software. It is not external ISO/IEEE/W3C adoption.

## Decision

Ship `reference-architectures` with Nest catalogs, Prisma `VgasRecord` persistence, honesty flags, console UI, and GraphQL/OpenAPI/SDK/CLI discovery.

## Consequences

Runnable internal/standards product tooling. Certificates are VerbaLab-issued only (`thirdPartyAccreditation=false`).
