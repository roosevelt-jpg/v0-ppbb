# ADR-0004: Stripe for billing entitlements

- **Status:** Accepted
- **Date:** 2026-09-06
- **Phase:** VL-031
- **Updated:** 2026-10-04

## Context

VerbaLab needs freemium + paid plans with usage metering. Storing cards ourselves is out of scope. Product pricing should feel familiar to builders coming from ElevenLabs.

## Decision

1. Use **Stripe Checkout + Customer Portal + webhooks**. Local entitlement fields on `organizations`: `plan`, `characterQuota` (monthly **credits**), `stripeCustomerId`, `stripeSubscriptionId`, `billingStatus`.
2. **ElevenLabs-mirrored plan ladder:** Free / Starter / Creator / Pro / Scale / Business / Enterprise with shared monthly credits and commercial/clone entitlements.
3. **Shared credit pool** across TTS, STT, translate, music, SFX, dubbing (see `billing/credits.ts`). Enforce via `assertWithinQuota` → `402 quota_exceeded`.
4. Paid commercial surfaces require **Starter+** (`assertPro`). Professional cloning gated at **Creator+** (`assertCreator`).

## Consequences

Live checkout/portal require Stripe env vars (per-plan price IDs). Tests cover free defaults, quota enforcement, and entitlement application without calling Stripe. Never store card data. See `docs/BILLING.md`.
