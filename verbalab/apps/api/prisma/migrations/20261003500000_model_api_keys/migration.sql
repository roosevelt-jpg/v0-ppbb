-- VerbaLab-owned model API keys
CREATE TABLE IF NOT EXISTS "model_api_keys" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "created_by_id" TEXT,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'live',
    "scopes" TEXT[] NOT NULL DEFAULT ARRAY['*']::TEXT[],
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "model_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "model_api_keys_prefix_idx" ON "model_api_keys"("prefix");
CREATE INDEX IF NOT EXISTS "model_api_keys_organization_id_idx" ON "model_api_keys"("organization_id");
CREATE INDEX IF NOT EXISTS "model_api_keys_secret_hash_idx" ON "model_api_keys"("secret_hash");
