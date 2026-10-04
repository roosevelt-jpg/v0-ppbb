# ADR-0043: Multi-region as residency islands

- Status: Accepted
- Date: 2026-09-07
- Updated: 2026-10-04 — Africa primary
- Phase: VL-075

## Context

Buyers require data residency. A global mesh / multi-master DB is out of scope.
VerbaLab’s home market is Africa — the primary cloud island must be African.

## Decision

1. **Separate islands:** Each region is its own Fly apps + `DATABASE_URL` / Redis.
   - Africa (primary): `infra/fly/api.toml` + `web.toml` (`jnb`, `VERBALAB_REGION=af`)
   - EU: `infra/fly/api.eu.toml` + `web.eu.toml` (`ams`, `eu`)
   - US: `infra/fly/api.us.toml` + `web.us.toml` (`iad`, `us`)
2. **`VERBALAB_REGION`:** Process env (`af` | `us` | `eu`) stamped on `/health` and `X-VerbaLab-Region`. Default when unset: **`af`**.
3. **Org pin:** `organizations.data_region` — new orgs default to `af`. When set, `ResidencyInterceptor` rejects authenticated traffic on the wrong island with `residency_mismatch`.
4. **No mesh:** No cross-region replication, automatic failover, or shared control plane. Changing the pin does **not** migrate data.
5. **Catalog:** Public `GET /v1/regions`; owner `GET/PATCH /v1/organization/residency`.

## Consequences

- Africa go-live is the default production path.
- EU/US go-live = create apps, attach regional Postgres/Redis, deploy `*.eu.toml` / `*.us.toml`.
- CI proves catalog + pin enforcement without a second live Fly account.
