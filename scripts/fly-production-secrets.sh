#!/usr/bin/env bash
# Apply production secrets to Fly apps. Requires flyctl + values in the environment.
# Usage:
#   export DATABASE_URL=… REDIS_URL=… CLERK_SECRET_KEY=sk_live_… …
#   ./scripts/fly-production-secrets.sh
set -euo pipefail

API_APP="${FLY_API_APP:-verbalab-api}"
WEB_APP="${FLY_WEB_APP:-verbalab-web}"

need() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env: $name" >&2
    exit 1
  fi
}

need DATABASE_URL
need REDIS_URL
need CLERK_SECRET_KEY
need NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
need CORS_ORIGIN
need NEXT_PUBLIC_API_URL

if [[ ! "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" =~ ^pk_live_ ]]; then
  echo "WARN: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not pk_live_ — use a Clerk production instance for end users." >&2
fi
if [[ ! "$CLERK_SECRET_KEY" =~ ^sk_live_ ]]; then
  echo "WARN: CLERK_SECRET_KEY is not sk_live_." >&2
fi

echo "Setting secrets on $API_APP…"
fly secrets set -a "$API_APP" \
  DATABASE_URL="$DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  CORS_ORIGIN="$CORS_ORIGIN" \
  CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  CLERK_WEBHOOK_SIGNING_SECRET="${CLERK_WEBHOOK_SIGNING_SECRET:-}" \
  STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}" \
  STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}" \
  STRIPE_PRICE_ID_PRO="${STRIPE_PRICE_ID_PRO:-}" \
  BILLING_SUCCESS_URL="${BILLING_SUCCESS_URL:-}" \
  BILLING_CANCEL_URL="${BILLING_CANCEL_URL:-}" \
  BILLING_PORTAL_RETURN_URL="${BILLING_PORTAL_RETURN_URL:-}" \
  VERBALAB_MODEL_API_KEY="${VERBALAB_MODEL_API_KEY:-}" \
  VERBALAB_MODEL_BASE_URL="${VERBALAB_MODEL_BASE_URL:-}" \
  VERBALAB_WEIGHTS_URL="${VERBALAB_WEIGHTS_URL:-}" \
  RESEND_API_KEY="${RESEND_API_KEY:-}" \
  EMAIL_FROM="${EMAIL_FROM:-}" \
  WEB_APP_URL="${WEB_APP_URL:-$CORS_ORIGIN}" \
  RATE_LIMIT_DISABLED=0 \
  JOBS_INLINE=0

echo "Setting secrets on $WEB_APP…"
fly secrets set -a "$WEB_APP" \
  CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  NEXT_PUBLIC_CLERK_DOMAIN="${NEXT_PUBLIC_CLERK_DOMAIN:-}"

echo "Deploy tip:"
echo "  fly deploy -c infra/fly/api.toml --dockerfile apps/api/Dockerfile"
echo "  fly deploy -c infra/fly/web.toml --dockerfile apps/web/Dockerfile \\"
echo "    --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \\"
echo "    --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \\"
echo "    --build-arg NEXT_PUBLIC_CLERK_DOMAIN=${NEXT_PUBLIC_CLERK_DOMAIN:-}"
echo "Done."
