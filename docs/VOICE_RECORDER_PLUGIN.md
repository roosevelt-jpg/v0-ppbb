# Phone Voice Recorder Plugin

Installable phone plugin that **records voice** and **transcribes to text** with VerbaLab Echo STT.

## Platforms

- **Android** — `ai.verbalab.sdk.VoiceRecorderPlugin` in `packages/sdk-android`
- **iOS** — `VoiceRecorderPlugin` in `packages/sdk-ios`

## Flow

1. `GET /v1/voice-recorder-plugin/manifest?platform=android|ios` — install instructions
2. `POST /v1/voice-recorder-plugin/sessions` — open session (pick language + speed tier)
3. Record on device (`beginRecording` / `stopAndTranscribe`)
4. `POST /v1/voice-recorder-plugin/transcribe` — multipart audio → transcript
5. `POST /v1/voice-recorder-plugin/finalize` — close session + full transcript

## Auth

`Authorization: Bearer vl_live_…` (or Clerk session).

## Monetization

Uses Model Economy SKU `vlm.field-notes-stt.<tier>`. Faster tiers cost more — quote via `/v1/model-economy/quote`.

## Console

`/voice-recorder-plugin`

## Related

- Model Economy: `/docs/MODEL_ECONOMY.md`
- Speech recognize: `POST /v1/speech/recognize`
