# Verba Voice

Grok-class conversational voice for African languages — session API for developers.

## Auth

`Authorization: Bearer vl_live_…` or Clerk session.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/verba-voice/engine` | Catalog |
| `POST` | `/v1/verba-voice/sessions` | Open a voice session |
| `GET` | `/v1/verba-voice/sessions/:id` | Session + turns |
| `GET` | `/v1/verba-voice/sessions/:id/events` | Event log (`?stream=1` for SSE) |
| `POST` | `/v1/verba-voice/text-turns` | Text in → Atlas reply + spoken audio |
| `POST` | `/v1/verba-voice/turns` | Multipart audio → STT → Atlas → TTS |

## Honesty

Turn-based voice sessions ship today (STT → Atlas → Voice FM). Full-duplex WebRTC barge-in is deferred (`POST /v1/verba-voice/webrtc`).

## Console

`/verba-voice`

## Related

- Model families: `GET /v1/model-keys/models`
- Meeting STT: `/docs/MEETING_TRANSCRIPTION.md`
