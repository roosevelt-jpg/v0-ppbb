-- Production robustness: partner webhooks, job idempotency, HTTP idempotency cache
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "partner_webhook_url" TEXT;

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "jobs_organization_id_idempotency_key_key" ON "jobs"("organization_id", "idempotency_key");

CREATE TABLE IF NOT EXISTS "idempotency_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_records_organization_id_key_key" ON "idempotency_records"("organization_id", "key");
CREATE INDEX IF NOT EXISTS "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

DO $$ BEGIN
  ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
