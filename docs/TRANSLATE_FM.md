# Translate FM

VerbaLab-owned model family for **VerbaLab African MT foundation model**.

## Endpoints

- `GET /v1/translate-fm/engine`
- `GET /v1/translate-fm/capabilities`
- `GET /v1/translate-fm/overview` (auth)
- `GET /v1/translate-fm/monitoring`

## Runtime

Served via VerbaLab Own AI (`VERBALAB_MODEL_BASE_URL` / modality URL + `VERBALAB_MODEL_API_KEY`).
Set `VERBALAB_OWN_AI_FIXTURE=1` for local/CI.
