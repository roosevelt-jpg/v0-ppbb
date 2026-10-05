# Voice FM

VerbaLab-owned model family for **VerbaLab neural TTS + cloning FM**.

## Endpoints

- `GET /v1/voice-fm/engine`
- `GET /v1/voice-fm/capabilities`
- `GET /v1/voice-fm/overview` (auth)
- `GET /v1/voice-fm/monitoring`

## Runtime

Served via VerbaLab Own AI (`VERBALAB_MODEL_BASE_URL` / modality URL + `VERBALAB_MODEL_API_KEY`).
Set `VERBALAB_OWN_AI_FIXTURE=1` for local/CI.
