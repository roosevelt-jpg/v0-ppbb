# Voice Trust Graph

Living consent graph for who may clone whom, for which use, in which country, with kinship witnesses and auto-revocation.

## APIs

- **Person and community nodes**: `POST /v1/voice-trust-graph/nodes`
- **Consent edges with scope**: `POST /v1/voice-trust-graph/consent`
- **Kinship / community witnesses**: `POST /v1/voice-trust-graph/witness`
- **Auto-revocation & lineage**: `POST /v1/voice-trust-graph/revoke`
- **Clone authorization check**: `POST /v1/voice-trust-graph/check`

Also: `GET /v1/voice-trust-graph/engine`, `/overview`, `/activity`, `/monitoring`.

## Console

`/voice-trust-graph`
