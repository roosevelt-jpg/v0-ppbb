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

| Layer | Language | Speech | Voice | Intelligence | Knowledge |
| --- | --- | --- | --- | --- | --- |
| Foundation | VL-130 `/language` | VL-150 `/speech` | VL-170 `/voice-cloud` | VL-180 `/intelligence-cloud` | VL-193 `/knowledge-cloud` |
| Core Engine | VL-140 Translate | VL-151 Recognition | VL-171 Neural TTS | VL-060 chat + VL-190 orchestration | VL-062 RAG (+ VL-198 Enterprise RAG) |
| AI Models | Google/OpenAI MT (+ LLM) | Whisper STT, OpenAI/own TTS, ElevenLabs | OpenAI/own TTS, ElevenLabs | OpenAI embeddings/chat (gateway) | OpenAI embeddings (shared) |
| Intelligence | Dialect/Grammar/Style/LI/TM | Speaker/Emotion/Audio/Wake/Call | Emotion/studio/enhance/biometrics/market | Memory/context/reason/recommend/decide | KB/search/ontology/taxonomy (VL-194+) |
| Enterprise APIs | `/v1/*` + GraphQL | `/v1/speech*` + GraphQL | `/v1/tts*` `/v1/voice-*` | `/v1/intelligence-cloud*` + GraphQL | `/v1/knowledge-cloud*` + `/v1/knowledge*` |
| SDK / CLI | `@verbalab/sdk` / CLI | speech methods | voice methods | `intelligenceProducts` + intel hubs | `knowledgeProducts` + knowledge hubs |
| Dashboard | `/language` | `/speech` | `/voice-cloud` | `/intelligence-cloud` | `/knowledge-cloud` |
| Analytics | VL-146 | VL-159 | VL-178 | VL-191 | VL-202 |
| Billing | shared metering | STT/TTS | TTS | chat/embeddings metering | embeddings/RAG metering |
| Security / Monitoring | shared | shared | + clone consent/watermark | shared + memory GDPR (VL-183) | tenant-scoped KB (VL-194+) |
| Production Audit | VL-147 | VL-160 | VL-179 | VL-192 | VL-203 |

### Rules

- **Extend shared platform** (Identity, Gateway, Billing, Observability, Deploy). Do not regenerate per cloud.  
- **Do not** create Vision/Media/… clouds until scheduled on ROADMAP with executable phases. Voice Cloud is scheduled as VL-170+.  
- Layers may be **partial** with honest deferred notes — empty stubs are forbidden.  
- Living docs: `ARCHITECTURE.md` + this ADR.

## Consequences

- Future volumes start from the same layer checklist.  
- Speech/Language remain hubs inside one API, not separate runtimes.
