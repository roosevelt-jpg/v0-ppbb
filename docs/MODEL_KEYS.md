# VerbaLab Model Keys

Developer keys for VerbaLab’s model families — the Claude / GPT / Grok lineup for African language intelligence.

## Key kinds

| Prefix | Purpose |
|---|---|
| `vmod_live_` / `vmod_test_` | Org model keys (mint once, shown once) |
| `vmod_root_` | Platform root → `VERBALAB_MODEL_API_KEY` |
| `vl_live_` / `vl_test_` | Product API keys (STT, meetings, Verba Voice, translate) |

## Endpoints

| Method | Path |
|---|---|
| `GET` | `/v1/model-keys/guide` |
| `GET` | `/v1/model-keys/models` |
| `GET` | `/v1/model-keys` |
| `POST` | `/v1/model-keys` |
| `POST` | `/v1/model-keys/platform-root` |
| `POST` | `/v1/model-keys/verify` |
| `DELETE` | `/v1/model-keys/:id` |

## Model families

Atlas · Echo · Voice FM · Translate FM · Baobab · Vector FM · Vision FM · Verba Voice

Live matrix: `GET /v1/models/live`

## Console

`/model-keys`
