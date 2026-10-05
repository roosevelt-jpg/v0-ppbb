# Meeting Transcription

Africa-wide meeting speech-to-text for developers building Zoom / Google Meet / custom WebRTC platforms.

## Auth

`Authorization: Bearer vl_live_…` (product API key) or Clerk session.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/meeting-transcription/engine` | Catalog + honesty |
| `GET` | `/v1/meeting-transcription/languages` | Full VerbaLab language list (Africa-wide STT) |
| `GET` | `/v1/meeting-transcription/overview` | Authed hub |
| `POST` | `/v1/meeting-transcription/sessions` | Start a meeting session |
| `GET` | `/v1/meeting-transcription/sessions/:id` | Fetch session + transcripts |
| `POST` | `/v1/meeting-transcription/transcribe` | Multipart `file` → text (+ optional `translateTo`) |
| `POST` | `/v1/meeting-transcription/recap` | Summary + optional spoken audio (`speak`) |

## Outputs

- Plain text transcript
- Segments / confidence (when provider returns them)
- Optional translation
- Spoken recap audio (base64) via Voice FM / TTS

## Console

`/meeting-transcription`

## Residency

Primary cloud residency is **Africa** (`VERBALAB_REGION=af`, Fly `jnb`). New orgs default to `dataRegion=af`.

## Protection

Metered routes use `RateLimitGuard`. All API responses carry VerbaLab trademark / watermark headers.
