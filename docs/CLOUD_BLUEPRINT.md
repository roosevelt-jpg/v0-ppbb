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
| Foundation Model Cloud | VL-224 → VL-238 (in progress) |

Inference Cloud volume closed (VL-204–213). AI Kernel volume closed (VL-214–223) with audit pack under `docs/ai-kernel-audit/`. Foundation Model Cloud Foundation shipped (VL-224); Model Training Platform partial (VL-235) — honest hub/scaffolds only; see [`FOUNDATION_MODEL_CLOUD.md`](./FOUNDATION_MODEL_CLOUD.md) and Volume 9 README. Named model training remains deferred (ADR-0041 / ADR-0135).
