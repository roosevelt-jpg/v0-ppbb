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

Inference Cloud volume closed (VL-204–213). AI Kernel volume closed (VL-214–223) with audit pack under `docs/ai-kernel-audit/`. Foundation Model Cloud volume closed (VL-224 + VL-235–238) with audit pack under `docs/foundation-model-cloud-audit/` — see [`FOUNDATION_MODEL_CLOUD.md`](./FOUNDATION_MODEL_CLOUD.md). Named-model scaffolds VL-225–234 and trained weights remain deferred (ADR-0041 / ADR-0135). AI Fabric Foundation shipped (VL-239) — see [`AI_FABRIC.md`](./AI_FABRIC.md). Event Fabric shipped (VL-240) — Redis Streams + CloudEvents; see [`EVENT_FABRIC.md`](./EVENT_FABRIC.md). Kafka/NATS/Rabbit adapters and Policy Fabric deferred; ask for next phases when ready.
