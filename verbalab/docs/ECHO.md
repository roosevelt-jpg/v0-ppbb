# Echo

VerbaLab-owned model family for **VerbaLab speech recognition FM**.

## Endpoints

- `GET /v1/echo/engine`
- `GET /v1/echo/capabilities`
- `GET /v1/echo/overview` (auth)
- `GET /v1/echo/monitoring`

## Runtime

Served via VerbaLab Own AI (`VERBALAB_MODEL_BASE_URL` / modality URL + `VERBALAB_MODEL_API_KEY`).
Set `VERBALAB_OWN_AI_FIXTURE=1` for local/CI.
