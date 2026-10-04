# Compliance Attestations

Issue residency/compliance attestations, generate industry DPAs, and export auditor evidence for African and global regulated buyers.

## Auth

Clerk session (`Authorization: Bearer …`) for action endpoints. `engine` / `monitoring` are public catalog surfaces.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/compliance-attestations/engine` | Catalog |
| `GET` | `/v1/compliance-attestations/overview` | Org overview |
| `GET` | `/v1/compliance-attestations/monitoring` | Health |
| `GET` | `/v1/compliance-attestations/activity` | Recent audit |
| `POST` | `/v1/compliance-attestations/issue` | Issue attestation |
| `POST` | `/v1/compliance-attestations/verify` | Verify attestation |
| `POST` | `/v1/compliance-attestations/dpa` | Generate industry DPA |
| `POST` | `/v1/compliance-attestations/evidence` | Export evidence pack |
| `GET` | `/v1/compliance-attestations/frameworks` | List frameworks |
| `GET` | `/v1/compliance-attestations/industries` | List industries |

## Honesty

Fully wired VerbaLab product — Nest module, console, SDK hooks, audit trails. Africa residency default (`af` / Fly `jnb`).

## Console

`/compliance-attestations`

## Related

- Frontier moonshots under console **Next-gen**
- Model Keys: `GET /v1/model-keys/models`
- Verba Voice duplex: `/docs/VERBA_VOICE.md`
