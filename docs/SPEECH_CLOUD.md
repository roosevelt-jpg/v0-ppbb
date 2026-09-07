# VerbaLab Speech Cloud

**Status:** Foundation shipped (VL-150 / library Phase 16)  
**Rule:** Parent hub for speech capabilities. Extend existing audio/voice modules. Do not regenerate Language Cloud, Identity, or AI Gateway.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Speech Cloud Foundation | **VL-150** — `/speech` + product catalog / overview |
| Batch STT | **VL-041** — `POST /v1/audio/transcriptions` |
| Streaming STT | Deferred — Phase 17 / **VL-122** |
| TTS / voices | **VL-042 / VL-121** — `POST /v1/audio/speech`, `GET /v1/audio/voices` |
| Speaker Intelligence | Deferred — Phase 18 |
| Accent Intelligence | Partial — **VL-132** cue scoring (`/accents`); acoustic models deferred |
| Emotion AI (audio) | Deferred — Phase 20 |
| Audio Intelligence | Deferred — Phase 21 |
| Pronunciation AI | Deferred — Phase 22 |
| Wake Word Engine | Deferred — Phase 23 |
| Call Intelligence | Deferred — Phase 24 (Voice FAQ ≠ Call Intelligence) |
| Speech Analytics | Deferred — Phase 25 (`/usage` covers metering today) |
| Voice Biometrics | Partial — **VL-064** consent-gated clones |
| Audio Enhancement | Deferred |
| Live interpreter | **VL-061** — `POST /v1/interpret` |
| GraphQL / CQRS | Bounded Speech Cloud slice (products query + catalog port) |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console hub | `/speech` |
| REST catalog | `GET /v1/speech/products` (public) |
| REST overview | `GET /v1/speech/overview` (Clerk session) |
| GraphQL | `speechProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `speechProducts()` on `@verbalab/sdk` |
| CLI | `verbalab speech-products` |
| Docs | this file + ADR-0069 |

---

## Architecture honesty

Speech Cloud is a **bounded enterprise speech API hub** in the Nest modular monolith:

- DDD / hexagonal / CQRS apply to the **Speech Cloud application slice** (catalog ports + GraphQL queries) — not a greenfield rewrite of `AudioModule`.
- Event-driven = existing audit + jobs only.
- Realtime / streaming = **not shipped** until Phase 17 / VL-122.
- Batch = file STT today.
- Monitoring / billing / analytics = shared observability + STT/TTS usage metering + Stripe entitlements; dedicated Speech Analytics product is Phase 25.
- Infra = Docker + Fly + GitHub Actions + optional Terraform/EKS (shared with Language Cloud).

Speech Cloud is **not** Deepgram + AssemblyAI + Twilio Voice Intelligence + Nuance + Amazon Transcribe combined.

See ADR-0069.
