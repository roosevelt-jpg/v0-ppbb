# VerbaLab Cloud Blueprint

**Status:** Accepted (ADR-0080)  
**Rule:** Every product cloud uses the same 12 layers. Extend the shared platform — do not invent empty clouds.

## The 12 layers

```
Cloud Foundation
│
├── Core Engine
├── AI Models
├── Intelligence Layer
├── Enterprise APIs
├── SDKs
├── CLI
├── Dashboard
├── Analytics
├── Billing Integration
├── Security
├── Monitoring
└── Production Audit
```

See [`docs/adr/0080-verbalab-cloud-blueprint.md`](./adr/0080-verbalab-cloud-blueprint.md) for Language/Speech mapping and governance rules.

## Shipped volumes

| Cloud | Foundation → Audit |
| --- | --- |
| Language | VL-130 → VL-147 |
| Speech | VL-150 → VL-160 |
| Voice | VL-170 → VL-179 |
| Intelligence | VL-180 → VL-192 |
| Knowledge | VL-193 → VL-203 |
| Inference | VL-204 → VL-213 |
| AI Kernel | VL-214 → VL-223 |
| Foundation Model Cloud | VL-224 → VL-238 |
| AI Fabric | VL-239 → VL-248 |
| Ecosystem Cloud | VL-249 → VL-259 |
| African Intelligence Cloud | VL-260 → VL-270 |
| Research Cloud | VL-271 → VL-280 |

Inference Cloud volume closed (VL-204–213). AI Kernel volume closed (VL-214–223) with audit pack under `docs/ai-kernel-audit/`. Foundation Model Cloud volume closed (VL-224 + VL-235–238) with audit pack under `docs/foundation-model-cloud-audit/` — see [`FOUNDATION_MODEL_CLOUD.md`](./FOUNDATION_MODEL_CLOUD.md). Named-model scaffolds VL-225–234 and trained weights remain deferred (ADR-0041 / ADR-0135). AI Fabric Foundation shipped (VL-239) — see [`AI_FABRIC.md`](./AI_FABRIC.md). Event Fabric shipped (VL-240) — Redis Streams + CloudEvents; see [`EVENT_FABRIC.md`](./EVENT_FABRIC.md). Context Fabric shipped (VL-241) — router over Context Runtime; see [`CONTEXT_FABRIC.md`](./CONTEXT_FABRIC.md). Knowledge Fabric shipped (VL-242) — router over Knowledge Cloud; see [`KNOWLEDGE_FABRIC.md`](./KNOWLEDGE_FABRIC.md). Prompt Fabric shipped (VL-243) — router over Prompt Runtime; see [`PROMPT_FABRIC.md`](./PROMPT_FABRIC.md). Reasoning Fabric shipped (VL-244) — router over Reasoning Runtime; see [`REASONING_FABRIC.md`](./REASONING_FABRIC.md). Memory Fabric shipped (VL-245) — router over Memory Runtime; see [`MEMORY_FABRIC.md`](./MEMORY_FABRIC.md). Agent Fabric shipped (VL-246) — sandboxed + Policy-gated router over Agent Runtime; see [`AGENT_FABRIC.md`](./AGENT_FABRIC.md). Policy Fabric shipped (VL-247) — fabric-wide hard gate; see [`POLICY_FABRIC.md`](./POLICY_FABRIC.md). AI Fabric Production Audit shipped (VL-248) — volume closed; see [`ai-fabric-audit/`](./ai-fabric-audit/). Ecosystem Cloud Foundation shipped (VL-249) — marketplace/monetization hub over VL-090+/voice marketplace; see [`ECOSYSTEM_CLOUD.md`](./ECOSYSTEM_CLOUD.md). Plugin Marketplace shipped (VL-250) — sandboxed + Policy-gated; see [`PLUGIN_MARKETPLACE.md`](./PLUGIN_MARKETPLACE.md). Model Marketplace shipped (VL-251) — license SKUs over registry; see [`MODEL_MARKETPLACE.md`](./MODEL_MARKETPLACE.md). Dataset Marketplace shipped (VL-252) — dataset kind + VL-101; see [`DATASET_MARKETPLACE.md`](./DATASET_MARKETPLACE.md). Prompt Marketplace shipped (VL-253) — prompt kind + Prompt Fabric; see [`PROMPT_MARKETPLACE.md`](./PROMPT_MARKETPLACE.md). Agent Marketplace shipped (VL-254) — sandboxed + Policy-gated; see [`AGENT_MARKETPLACE.md`](./AGENT_MARKETPLACE.md). Workflow Marketplace shipped (VL-255) — sandboxed + Policy-gated; see [`WORKFLOW_MARKETPLACE.md`](./WORKFLOW_MARKETPLACE.md). Connector Marketplace shipped (VL-256) — entitlement SKUs + Stripe honesty; see [`CONNECTOR_MARKETPLACE.md`](./CONNECTOR_MARKETPLACE.md). Voice & Language Marketplace shipped (VL-257) — pack entitlements over VL-177 + Volume 1; see [`VOICE_LANGUAGE_MARKETPLACE.md`](./VOICE_LANGUAGE_MARKETPLACE.md). Creator Economy shipped (VL-258) — royalty math + tax/dispute honesty over VL-092; see [`CREATOR_ECONOMY.md`](./CREATOR_ECONOMY.md). Ecosystem Production Audit shipped (VL-259) — evidence pack under [`ecosystem-cloud-audit/`](./ecosystem-cloud-audit/); Volume 11 closed. African Intelligence Cloud Foundation shipped (VL-260) — see [`AFRICAN_INTELLIGENCE_CLOUD.md`](./AFRICAN_INTELLIGENCE_CLOUD.md). African Language Registry shipped (VL-261). Cultural Intelligence shipped (VL-262) — consent/provenance required. African Knowledge Graph shipped (VL-263) — `neo4jOs=false`. Government/Healthcare/Financial/Education/Agricultural/Tourism-Heritage Intelligence shipped (VL-264–269) with domain safety flags. African Intelligence Production Audit shipped (VL-270) — evidence pack under [`african-intelligence-cloud-audit/`](./african-intelligence-cloud-audit/); Volume 12 closed. Research Cloud Foundation shipped (VL-271) — see [`RESEARCH_CLOUD.md`](./RESEARCH_CLOUD.md). Experiment/Synthetic/Benchmark/Evaluation/Publication/Patent/Open-Science/Analytics shipped (VL-272–279) with honesty flags. Research Cloud Production Audit shipped (VL-280) — evidence pack under [`research-cloud-audit/`](./research-cloud-audit/); Volume 13 closed. AI Sovereignty Cloud / MLOps Platform → Volume 14+ when scheduled.
