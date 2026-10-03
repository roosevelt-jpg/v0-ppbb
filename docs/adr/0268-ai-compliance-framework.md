# ADR-0268: AI Compliance Framework

## Status

Accepted - Volume 22 Phase 233 (VL-366).

## Context

VGAS is VerbaLab's own standards/certification platform software. It is not external ISO/IEEE/W3C adoption.

## Decision

Ship `ai-compliance-framework` with Nest catalogs, Prisma `VgasRecord` persistence, honesty flags, console UI, and GraphQL/OpenAPI/SDK/CLI discovery.

## Consequences

Runnable internal/standards product tooling. Certificates are VerbaLab-issued only (`thirdPartyAccreditation=false`).
