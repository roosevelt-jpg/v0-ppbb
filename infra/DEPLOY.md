# Production deploy

Two supported paths:

1. **Fly.io (default PaaS)** — this document (VL-074 / ADR-0023)  
2. **AWS EKS `af-south-1`** — [`AWS_EKS.md`](./AWS_EKS.md) + Terraform under `infra/terraform/aws-eks/` (VL-138 / ADR-0059)

PaaS choice for day-to-day: **Fly.io**. EKS is optional when AWS/K8s is required.

Enterprise Language Registry (VL-139), Localization Platform (VL-141), and Language Analytics (VL-146) ship with the API database/migrations + boot seed / Intl helpers. Language Cloud production audit evidence: [`docs/language-cloud-audit/`](../docs/language-cloud-audit/) (VL-147). Speech Cloud production audit evidence: [`docs/speech-cloud-audit/`](../docs/speech-cloud-audit/) (VL-160). Voice Cloud production audit evidence: [`docs/voice-cloud-audit/`](../docs/voice-cloud-audit/) (VL-179). Cloud blueprint: [`docs/CLOUD_BLUEPRINT.md`](../docs/CLOUD_BLUEPRINT.md) (ADR-0080).

## Architecture (Fly)

| Piece | What |
| --- | --- |
| `verbalab-api` | Nest API container (`apps/api/Dockerfile`) |
| `verbalab-web` | Next console (`apps/web/Dockerfile`) |
| Postgres | Managed DB with **pgvector** (Neon / Supabase / Fly Postgres + `CREATE EXTENSION vector`) via `DATABASE_URL` |
| Redis | Required for BullMQ + rate limits (`REDIS_URL`). Fly Redis or Upstash. Do **not** set `JOBS_INLINE=1` in production. |
| Region | Default `iad` in `infra/fly/*.toml` — change `primary_region` for your market |

## First-time setup (manual; needs Fly account)

```bash
# Install flyctl, then:
fly auth login
fly apps create verbalab-api
fly apps create verbalab-web

# Preferred: export secrets then run the helper (validates pk_live_/sk_live_)
export DATABASE_URL=… REDIS_URL=… CLERK_SECRET_KEY=sk_live_… \
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_… CORS_ORIGIN=… NEXT_PUBLIC_API_URL=…
# optional: CLERK_WEBHOOK_SIGNING_SECRET NEXT_PUBLIC_CLERK_DOMAIN VERBALAB_WEIGHTS_URL …
./scripts/fly-production-secrets.sh
```

Or set secrets manually:

```bash
fly secrets set -a verbalab-api \
  DATABASE_URL='postgresql://...' \
  REDIS_URL='redis://...' \
  CORS_ORIGIN='https://verbalab-web.fly.dev' \
  CLERK_SECRET_KEY='sk_live_...' \
  CLERK_WEBHOOK_SIGNING_SECRET='whsec_...' \
  VERBALAB_WEIGHTS_URL='https://…/manifest.json' \
  STRIPE_SECRET_KEY='...' \
  STRIPE_WEBHOOK_SECRET='...' \
  STRIPE_PRICE_ID_PRO='...' \
  BILLING_SUCCESS_URL='https://verbalab-web.fly.dev/billing?checkout=success' \
  BILLING_CANCEL_URL='https://verbalab-web.fly.dev/billing?checkout=cancel' \
  BILLING_PORTAL_RETURN_URL='https://verbalab-web.fly.dev/billing' \
  RATE_LIMIT_DISABLED=0 \
  JOBS_INLINE=0

# Web build args are set at deploy time; also set runtime Clerk secret if used server-side:
fly secrets set -a verbalab-web \
  CLERK_SECRET_KEY='sk_live_...' \
  NEXT_PUBLIC_CLERK_DOMAIN='accounts.yourdomain.com'
```

Deploy (from repo root):

```bash
fly deploy -c infra/fly/api.toml --dockerfile apps/api/Dockerfile
fly deploy -c infra/fly/web.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://verbalab-api.fly.dev \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... \
  --build-arg NEXT_PUBLIC_CLERK_DOMAIN=accounts.yourdomain.com
```

Production checklist after deploy: Clerk webhook → org bootstrap, Redis rate limits on, partner webhooks (`docs/PARTNER_WEBHOOKS.md`), 60s SDK path (`docs/QUICKSTART.md` / `/docs/quickstart`).

API **release_command** runs `pnpm db:migrate` (`prisma migrate deploy`) before each new release replaces machines.

## Migrations

- Local authoring: `pnpm db:migrate:dev`
- CI + production: `pnpm db:migrate` (`prisma migrate deploy`)
- CI already migrates against ephemeral Postgres on every PR (`ci.yml`)
- Production migrate: Fly API `release_command` (and optional GitHub deploy job)

## GitHub Actions deploy

`.github/workflows/deploy.yml` runs on push to `main`/`master` when `FLY_API_TOKEN` is set as a repository secret. Without the token the job **skips** (no failure) so forks and local CI stay green.

Optional secrets: `FLY_API_TOKEN`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

Optional EU island (VL-075): set repository **variable** `FLY_DEPLOY_EU=true` and secret `NEXT_PUBLIC_API_URL_EU` to also deploy `infra/fly/*.eu.toml`.

## Local Docker dry-run (no Fly secrets)

```bash
docker build -f apps/api/Dockerfile -t verbalab-api .
docker build -f apps/web/Dockerfile -t verbalab-web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .
```

### Smoke health checks

Both apps expose `GET /health` (Fly `http_service.checks` + Docker `HEALTHCHECK`).

With API + web already running (`pnpm dev` or containers):

```bash
pnpm smoke
```

Web-only Docker smoke (builds + runs web, skips needing a live API if you set the flag):

```bash
SMOKE_DOCKER_WEB=1 SMOKE_SKIP_API=1 pnpm smoke
```

Full container smoke for API needs Compose Postgres/Redis reachable from the container (`host.docker.internal` on Docker Desktop) plus `DATABASE_URL` / `REDIS_URL` / `JOBS_INLINE=1`.

## Preview deploys

Deferred. Ship one production pair first; add Fly preview apps later if needed.

- Global mesh / multi-master Postgres / automatic geo-failover
- Separate worker process (jobs run inside the API today)
- Object storage for multi-instance document disks (single machine / volume is enough for MVP)

## Multi-region residency (VL-075)

Each region is a **separate deploy + database** (residency island), not a mesh.
**Primary cloud residency is Africa** (`jnb` / Johannesburg).

| Island | Fly configs | `VERBALAB_REGION` | Fly `primary_region` |
| --- | --- | --- | --- |
| Africa (default) | `infra/fly/api.toml`, `web.toml` | `af` | `jnb` |
| EU | `infra/fly/api.eu.toml`, `web.eu.toml` | `eu` | `ams` |
| US | `infra/fly/api.us.toml`, `web.us.toml` | `us` | `iad` |

```bash
# Primary Africa island (default)
fly deploy -c infra/fly/api.toml --dockerfile apps/api/Dockerfile
fly deploy -c infra/fly/web.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://verbalab-api.fly.dev \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# Optional EU island
fly apps create verbalab-api-eu
fly apps create verbalab-web-eu
fly secrets set -a verbalab-api-eu DATABASE_URL='...' REDIS_URL='...' VERBALAB_REGION=eu ...
fly deploy -c infra/fly/api.eu.toml --dockerfile apps/api/Dockerfile
```

New organizations default to `dataRegion=af`. Orgs may pin via `PATCH /v1/organization/residency`. A pin that mismatches the deploy island rejects authenticated calls (`residency_mismatch`). **Pinning does not migrate data.**
