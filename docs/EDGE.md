# Edge

VerbaLab-owned model family for **On-device / edge inference pack**.

## Endpoints

- `GET /v1/edge/engine`
- `GET /v1/edge/capabilities`
- `GET /v1/edge/overview` (auth)
- `GET /v1/edge/monitoring`

## Runtime

Served via VerbaLab Own AI (`VERBALAB_MODEL_BASE_URL` / modality URL + `VERBALAB_MODEL_API_KEY`).
Set `VERBALAB_OWN_AI_FIXTURE=1` for local/CI.
