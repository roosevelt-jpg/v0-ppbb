# ADR-0080: VerbaLab Cloud Blueprint (12 standard layers)

- Status: Accepted
- Date: 2026-09-07
- Phase: Post Speech Cloud volume (VL-160 companion)

## Context

After Language Cloud (VL-130–147) and Speech Cloud (VL-150–160), the library asks every VerbaLab “cloud” (Language, Speech, Voice, Vision, Media, Intelligence, Knowledge, AI, …) to share the same internal blueprint so products stay consistent instead of isolated one-offs.

Creating empty folder clouds for Vision/Media/etc. would violate executable ROADMAP rules. The blueprint must map onto the **existing modular monolith** (shared Identity, Gateway, Billing, Observability) rather than spawning duplicate platforms.

## Decision

Every VerbaLab product cloud **shall** organize work and docs against these **12 layers**:

1. **Cloud Foundation** — hub catalog/overview + bounded domain module  
2. **Core Engine** — primary capability engine (translate / speech recognize / …)  
3. **AI Models** — vendor adapters + own/rented model paths (honest env gating)  
4. **Intelligence Layer** — adjacent AI products (grammar, speaker, emotion, call, …)  
5. **Enterprise APIs** — versioned REST (+ GraphQL façade where present)  
6. **SDKs** — `@verbalab/sdk` methods  
7. **CLI** — `@verbalab/cli` commands  
8. **Dashboard** — Next.js console routes  
9. **Analytics** — usage/audit aggregates for that cloud  
10. **Billing Integration** — metering + Stripe entitlements (shared)  
11. **Security** — tenant auth, rate limits, audit  
12. **Production Audit** — checklist + evidence pack closing the volume  

### Mapping today

| Layer | Language Cloud | Speech Cloud |
| --- | --- | --- |
| Foundation | VL-130 `/language` | VL-150 `/speech` |
| Core Engine | VL-140 Translate | VL-151 Recognition |
| AI Models | Google/OpenAI MT (+ optional LLM) | Whisper STT, OpenAI/own TTS, ElevenLabs clones |
| Intelligence | Dialect/Accent/Grammar/Style/LI/TM | Speaker/Accent/Emotion/Audio/Pronunciation/Wake/Call |
| Enterprise APIs | `/v1/*` + GraphQL | `/v1/speech*` + GraphQL |
| SDK / CLI | `@verbalab/sdk` / CLI | same packages, speech methods |
| Dashboard | `/language`, product consoles | `/speech`, product consoles |
| Analytics | VL-146 `/v1/analytics` | VL-159 `/v1/speech-analytics` |
| Billing | shared STT/TTS/translate metering | shared STT/TTS metering |
| Security / Monitoring | shared | shared |
| Production Audit | VL-147 | VL-160 |

### Rules

- **Extend shared platform** (Identity, Gateway, Billing, Observability, Deploy). Do not regenerate per cloud.  
- **Do not** create Voice/Vision/… clouds until scheduled on ROADMAP with executable phases.  
- Layers may be **partial** with honest deferred notes — empty stubs are forbidden.  
- Living docs: `ARCHITECTURE.md` + this ADR.

## Consequences

- Future volumes start from the same layer checklist.  
- Speech/Language remain hubs inside one API, not separate runtimes.
