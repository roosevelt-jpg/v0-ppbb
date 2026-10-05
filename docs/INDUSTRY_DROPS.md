# Industry Drops

Install banking, healthcare, government, telco, and agri vertical packs with glossaries, prompts, and eval gates.

## Auth

Clerk session (`Authorization: Bearer …`) for action endpoints. `engine` / `monitoring` are public catalog surfaces.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/industry-drops/engine` | Catalog |
| `GET` | `/v1/industry-drops/overview` | Org overview |
| `GET` | `/v1/industry-drops/monitoring` | Health |
| `GET` | `/v1/industry-drops/activity` | Recent audit |
| `POST` | `/v1/industry-drops/install` | Install drop |
| `POST` | `/v1/industry-drops/configure` | Configure drop |
| `POST` | `/v1/industry-drops/evaluate` | Run drop eval gate |
| `POST` | `/v1/industry-drops/export` | Export drop manifest |
| `GET` | `/v1/industry-drops/packs` | List packs |

## Honesty

Fully wired VerbaLab product — Nest module, console, SDK hooks, audit trails. Africa residency default (`af` / Fly `jnb`).

## Console

`/industry-drops`

## Related

- Frontier moonshots under console **Next-gen**
- Model Keys: `GET /v1/model-keys/models`
- Verba Voice duplex: `/docs/VERBA_VOICE.md`
