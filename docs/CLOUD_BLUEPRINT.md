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

Inference Cloud volume closed (VL-204–213). AI Kernel Foundation shipped (VL-214); Memory Runtime partial (VL-215). Vision / Media / Foundation Model Cloud remain **unscheduled** until ROADMAP executable phases exist.
