# Civic Voice Seal

Verifiable seal for public voices — authentic now, or synthetic/revoked — checked in under a second on a listener device.

## APIs

- **Issue civic voice seal**: `POST /v1/civic-voice-seal/issue`
- **Verify seal in <1s path**: `POST /v1/civic-voice-seal/verify`
- **Continuous challenge**: `POST /v1/civic-voice-seal/challenge`
- **Revoke public seal**: `POST /v1/civic-voice-seal/revoke`
- **Public seal directory**: `GET /v1/civic-voice-seal/directory`

Also: `GET /v1/civic-voice-seal/engine`, `/overview`, `/activity`, `/monitoring`.

## Console

`/civic-voice-seal`
