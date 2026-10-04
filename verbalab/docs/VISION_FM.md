# Vision FM

VerbaLab-owned model family for **VerbaLab OCR / document vision FM**.

## Endpoints

- `GET /v1/vision-fm/engine`
- `GET /v1/vision-fm/capabilities`
- `GET /v1/vision-fm/overview` (auth)
- `GET /v1/vision-fm/monitoring`

## Runtime

Served via VerbaLab Own AI (`VERBALAB_MODEL_BASE_URL` / modality URL + `VERBALAB_MODEL_API_KEY`).
Set `VERBALAB_OWN_AI_FIXTURE=1` for local/CI.
