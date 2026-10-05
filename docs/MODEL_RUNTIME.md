# VerbaLab Model Runtime

Local Own AI runtime (all modalities), African quality eval, neural weight deploy path, and enterprise production unlocks.

## What's honest to say out loud

1. **Local Own AI runs in-process** — MT / STT / TTS / chat / embed / OCR / detect / clone without rented third-party AI vendors.
2. **African quality is measured** — `GET /v1/model-runtime/eval` reports exact-match Own AI vs a weak English-centric vendor baseline stub on forward + reverse lexicon packs.
3. **Gov / bank / hospital unlocks are gated** — checklist defaults locked; wired into Enterprise Nation Platform + Government Intelligence.
4. **Neural weights are deploy artifacts** — `VERBALAB_WEIGHTS_URL` (+ `manifest.json`) probed at runtime; unreachable URL keeps local lexicon active. Not git-shipped SOTA.

## APIs

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/model-runtime/engine` | Runtime + deploy + weights probe + African engine |
| GET | `/v1/model-runtime/deploy` | Deploy shape / env / weights |
| GET | `/v1/model-runtime/packs` | Lexicon packs (forward + reverse) |
| GET | `/v1/model-runtime/eval` | African quality report |
| GET | `/v1/model-runtime/modalities/smoke` | Live smoke across all modalities |
| GET | `/v1/model-runtime/unlocks` | All sector unlock states |
| GET | `/v1/model-runtime/unlocks/:sector` | `government` \| `banking` \| `hospital` |
| POST | `/v1/model-runtime/unlocks/:sector/assert` | Operator assert checklist (auth) |
| POST | `/v1/model-runtime/translate` | Direct African lexicon MT |
| POST | `/v1/model-runtime/gateway/translate` | Gateway Own AI MT path |
| POST | `/v1/model-runtime/gateway/chat` | Gateway Own AI chat path |
| POST | `/v1/model-runtime/gateway/detect` | Gateway Own AI detect path |
| GET | `/v1/model-runtime/overview` | Auth overview + honest claims |
| GET | `/v1/model-runtime/monitoring` | Monitoring snapshot |

## Env

```bash
# Local runtime (default on). Set 0 to disable.
VERBALAB_LOCAL_MODEL_RUNTIME=1

# Optional neural / pod upgrade (same API surface)
VERBALAB_WEIGHTS_URL=https://models.your-domain.com/weights/translate-fm
# expects GET $VERBALAB_WEIGHTS_URL/manifest.json and optional POST .../translate
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

`/model-runtime` under **Own models** — try MT, modality smoke, eval-by-pair, unlock assert.

## Related

- ADR-0325
- Enterprise Nation: `/enterprise-nation-platform`
- Government Intelligence: `/government-intelligence`
- Credentials: `/credentials-readiness`
