# Africa Eval Matrix

WER, MOS, and intent scores across African languages, accents, and domains for buyers and model teams.

## Auth

Clerk session (`Authorization: Bearer …`) for action endpoints. `engine` / `monitoring` are public catalog surfaces.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/africa-eval-matrix/engine` | Catalog |
| `GET` | `/v1/africa-eval-matrix/overview` | Org overview |
| `GET` | `/v1/africa-eval-matrix/monitoring` | Health |
| `GET` | `/v1/africa-eval-matrix/activity` | Recent audit |
| `None` | `/v1/africa-eval-matrix/score` | Score sample |
| `POST` | `/v1/africa-eval-matrix/compare` | Compare models |
| `POST` | `/v1/africa-eval-matrix/suite` | Run matrix suite |
| `POST` | `/v1/africa-eval-matrix/publish` | Publish slice |
| `GET` | `/v1/africa-eval-matrix/matrix` | View matrix |
| `GET` | `/v1/africa-eval-matrix/languages` | Covered languages |

## Honesty

Fully wired VerbaLab product — Nest module, console, SDK hooks, audit trails. Africa residency default (`af` / Fly `jnb`).

## Console

`/africa-eval-matrix`

## Related

- Frontier moonshots under console **Next-gen**
- Model Keys: `GET /v1/model-keys/models`
- Verba Voice duplex: `/docs/VERBA_VOICE.md`
