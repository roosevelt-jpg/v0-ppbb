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
| `POST` | `/v1/verba-voice/webrtc` | Open full-duplex WebRTC signaling |
| `POST` | `/v1/verba-voice/webrtc/signal` | Exchange SDP offer/answer/ICE |
| `POST` | `/v1/verba-voice/webrtc/barge-in` | Interrupt / resume / enable / disable |

## Honesty

Turn-based voice sessions (STT → Atlas → Voice FM) and full-duplex WebRTC signaling with barge-in control are both shipped. Media plane uses client WebRTC with STUN; media relay TURN credentials are deploy-configured.

## Residency

Primary cloud residency is **Africa** (`VERBALAB_REGION=af`, Fly `jnb`). New orgs default to `dataRegion=af`.

## Console

`/verba-voice`

## Related

- Model families: `GET /v1/model-keys/models`
- Meeting STT: `/docs/MEETING_TRANSCRIPTION.md`
- Edge offline packs: `/docs/EDGE_OFFLINE.md`
