# VerbaLab Model Runtime

Local Own AI runtime, African quality eval, and enterprise production unlocks.

## What's honest to say out loud

1. **Local Own AI runs in-process** — African linguistic engine serves MT without rented OpenAI / ElevenLabs / Google.
2. **African quality is measured** — `GET /v1/model-runtime/eval` reports exact-match Own AI vs a weak English-centric vendor baseline stub on lexicon packs.
3. **Gov / bank / hospital unlocks are gated** — production stays locked until residency, audit, DPA/BAA, and sector safety checklist items are met.
4. **Neural weights are deploy artifacts** — set `VERBALAB_WEIGHTS_URL` or `VERBALAB_MODEL_BASE_URL`; binaries are not claimed as git-shipped SOTA.

## APIs

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/model-runtime/engine` | Runtime + deploy + African engine |
| GET | `/v1/model-runtime/deploy` | Deploy shape / env |
| GET | `/v1/model-runtime/packs` | Lexicon packs |
| GET | `/v1/model-runtime/eval` | African quality report |
| GET | `/v1/model-runtime/unlocks` | All sector unlock states |
| GET | `/v1/model-runtime/unlocks/:sector` | `government` \| `banking` \| `hospital` |
| POST | `/v1/model-runtime/unlocks/:sector/assert` | Operator assert checklist (auth) |
| POST | `/v1/model-runtime/translate` | Direct local African MT |
| GET | `/v1/model-runtime/overview` | Auth overview + honest claims |

## Env

```bash
# Local runtime (default on). Set 0 to disable.
VERBALAB_LOCAL_MODEL_RUNTIME=1

# Optional neural / pod upgrade (same API surface)
VERBALAB_WEIGHTS_URL=
VERBALAB_MODEL_BASE_URL=
VERBALAB_MODEL_API_KEY=

# Enterprise unlock probes
VERBALAB_REGION=ke
VERBALAB_DATA_RESIDENCY=ke
VERBALAB_ENTERPRISE_DPA=1
VERBALAB_PCI_SCOPE_DOCUMENTED=1
VERBALAB_CLINICAL_SAFETY_SIGNED=1
VERBALAB_HEALTH_BAA=1
# Keep vendor fallback off for sovereign_mt
# VERBALAB_ALLOW_VENDOR_FALLBACK=1
```

## Console

`/model-runtime` under **Own models**.
