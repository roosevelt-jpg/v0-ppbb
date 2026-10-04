# Model Economy

Monetize VerbaLab models by **use case** and **speed tier**. Faster models cost more; eco tiers cost less — efficiency vs productivity.

## Speed tiers

| Tier | Relative cost | Typical p50 latency | When to use |
|---|---|---|---|
| `eco` | ×1 | ~1800ms | Batch, overnight, cost-sensitive |
| `standard` | ×2.5 | ~700ms | Default product workloads |
| `turbo` | ×5 | ~280ms | Interactive UX |
| `ultra` | ×10 | ~120ms | Real-time voice / live meetings |

## Use cases

Meeting STT, field/phone notes, call center, voice assist, chat, TTS, translate, media caption — each with SKUs like `vlm.field-notes-stt.turbo`.

## Auth

Clerk session for quote/select/meter. Catalog and tiers are public.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/model-economy/engine` | Catalog |
| `GET` | `/v1/model-economy/catalog` | Use cases + SKU prices |
| `GET` | `/v1/model-economy/tiers` | Speed ladder |
| `POST` | `/v1/model-economy/quote` | Unit price for useCase+tier |
| `POST` | `/v1/model-economy/estimate` | Workload cost + eco/ultra compare |
| `POST` | `/v1/model-economy/select` | Bind a SKU for an org |
| `POST` | `/v1/model-economy/meter` | Record billable usage |

## Console

`/model-economy`

## Related

- Model keys: `/docs/MODEL_KEYS.md`
- Phone recorder plugin: `/docs/VOICE_RECORDER_PLUGIN.md`
