# Baobab

VerbaLab-owned model family for **African language specialist LLM**.

## Endpoints

- `GET /v1/baobab/engine`
- `GET /v1/baobab/capabilities`
- `GET /v1/baobab/overview` (auth)
- `GET /v1/baobab/monitoring`

## Runtime

Served via VerbaLab Own AI (`VERBALAB_MODEL_BASE_URL` / modality URL + `VERBALAB_MODEL_API_KEY`).
Set `VERBALAB_OWN_AI_FIXTURE=1` for local/CI.
