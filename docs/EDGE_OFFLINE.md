# Edge Offline Packs

Build, sign, and sync Echo STT / Voice FM offline packs for edge and low-connectivity African deployments.

## Auth

Clerk session (`Authorization: Bearer …`) for action endpoints. `engine` / `monitoring` are public catalog surfaces.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/edge-offline/engine` | Catalog |
| `GET` | `/v1/edge-offline/overview` | Org overview |
| `GET` | `/v1/edge-offline/monitoring` | Health |
| `GET` | `/v1/edge-offline/activity` | Recent audit |
| `POST` | `/v1/edge-offline/build` | Build offline pack |
| `POST` | `/v1/edge-offline/sign` | Sign pack |
| `POST` | `/v1/edge-offline/sync` | Sync pack delta |
| `POST` | `/v1/edge-offline/verify` | Verify pack integrity |
| `GET` | `/v1/edge-offline/catalog` | Pack catalog |

## Honesty

Fully wired VerbaLab product — Nest module, console, SDK hooks, audit trails. Africa residency default (`af` / Fly `jnb`).

## Console

`/edge-offline`

## Related

- Frontier moonshots under console **Next-gen**
- Model Keys: `GET /v1/model-keys/models`
- Verba Voice duplex: `/docs/VERBA_VOICE.md`
