# Voice Passport

Portable voice identity credentials with consent scopes, endorsements, and cross-border purpose checks.

## Auth

Clerk session (`Authorization: Bearer …`) for action endpoints. `engine` / `monitoring` are public catalog surfaces.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/voice-passport/engine` | Catalog |
| `GET` | `/v1/voice-passport/overview` | Org overview |
| `GET` | `/v1/voice-passport/monitoring` | Health |
| `GET` | `/v1/voice-passport/activity` | Recent audit |
| `POST` | `/v1/voice-passport/issue` | Issue passport |
| `POST` | `/v1/voice-passport/endorse` | Endorse passport |
| `POST` | `/v1/voice-passport/check` | Check authorization |
| `POST` | `/v1/voice-passport/revoke` | Revoke passport |
| `GET` | `/v1/voice-passport/directory` | Directory |

## Honesty

Fully wired VerbaLab product — Nest module, console, SDK hooks, audit trails. Africa residency default (`af` / Fly `jnb`).

## Console

`/voice-passport`

## Related

- Frontier moonshots under console **Next-gen**
- Model Keys: `GET /v1/model-keys/models`
- Verba Voice duplex: `/docs/VERBA_VOICE.md`
