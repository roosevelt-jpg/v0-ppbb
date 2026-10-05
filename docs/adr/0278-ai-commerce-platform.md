# ADR-0278 — AI Commerce Platform

## Status

Accepted - Volume 23 Phase 242 (VL-375).

## Context

Volume 23 README: build marketplace/commerce software, not a claim of world-largest AI economy.
Money movement uses existing Stripe/billing; revenue share is ledger/workflow; investment is dashboard-only.

## Decision

Ship `ai-commerce-platform` with AIE honesty flags. VL-375 Catalogs/subscriptions/invoices via existing Stripe billing — no hand-rolled card handling.

## Consequences

Console + REST + GraphQL engine available. Real payouts/securities/tax remain human + provider concerns.
