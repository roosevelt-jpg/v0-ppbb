# ADR-0284 — AI Investment Platform

## Status

Accepted - Volume 23 Phase 248 (VL-381).

## Context

Volume 23 README: build marketplace/commerce software, not a claim of world-largest AI economy.
Money movement uses existing Stripe/billing; revenue share is ledger/workflow; investment is dashboard-only.

## Decision

Ship `ai-investment-platform` with AIE honesty flags. VL-381 Investment *dashboard/reporting only*. fundingPortalOs=false; securitiesOfferingOs=false.

## Consequences

Console + REST + GraphQL engine available. Real payouts/securities/tax remain human + provider concerns.
