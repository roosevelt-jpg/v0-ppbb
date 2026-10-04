# Developer Gravity

Sandbox keys, quickstarts, OpenAPI refs, and sample scaffolds that pull builders into VerbaLab.

## Auth

Clerk session (`Authorization: Bearer …`) for action endpoints. `engine` / `monitoring` are public catalog surfaces.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/developer-gravity/engine` | Catalog |
| `GET` | `/v1/developer-gravity/overview` | Org overview |
| `GET` | `/v1/developer-gravity/monitoring` | Health |
| `GET` | `/v1/developer-gravity/activity` | Recent audit |
| `POST` | `/v1/developer-gravity/sandbox` | Create sandbox |
| `POST` | `/v1/developer-gravity/quickstart` | Generate quickstart |
| `POST` | `/v1/developer-gravity/refs` | Resolve API refs |
| `POST` | `/v1/developer-gravity/sample` | Scaffold sample app |
| `GET` | `/v1/developer-gravity/catalog` | DX catalog |

## Honesty

Fully wired VerbaLab product — Nest module, console, SDK hooks, audit trails. Africa residency default (`af` / Fly `jnb`).

## Console

`/developer-gravity`

## Related

- Frontier moonshots under console **Next-gen**
- Model Keys: `GET /v1/model-keys/models`
- Verba Voice duplex: `/docs/VERBA_VOICE.md`
