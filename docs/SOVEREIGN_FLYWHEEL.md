# Sovereign Data Flywheel

Consented African speech/text loops into residency-bound fine-tunes and Model Keys promotions.

## Auth

Clerk session (`Authorization: Bearer …`) for action endpoints. `engine` / `monitoring` are public catalog surfaces.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/sovereign-flywheel/engine` | Catalog |
| `GET` | `/v1/sovereign-flywheel/overview` | Org overview |
| `GET` | `/v1/sovereign-flywheel/monitoring` | Health |
| `GET` | `/v1/sovereign-flywheel/activity` | Recent audit |
| `POST` | `/v1/sovereign-flywheel/ingest` | Ingest consented batch |
| `POST` | `/v1/sovereign-flywheel/curate` | Curate dataset |
| `POST` | `/v1/sovereign-flywheel/finetune` | Start fine-tune job |
| `POST` | `/v1/sovereign-flywheel/promote` | Promote model drop |
| `GET` | `/v1/sovereign-flywheel/datasets` | List datasets |
| `GET` | `/v1/sovereign-flywheel/jobs` | List jobs |

## Honesty

Fully wired VerbaLab product — Nest module, console, SDK hooks, audit trails. Africa residency default (`af` / Fly `jnb`).

## Console

`/sovereign-flywheel`

## Related

- Frontier moonshots under console **Next-gen**
- Model Keys: `GET /v1/model-keys/models`
- Verba Voice duplex: `/docs/VERBA_VOICE.md`
