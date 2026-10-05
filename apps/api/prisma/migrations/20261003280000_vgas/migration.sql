-- Volume 22 VGAS records
CREATE TABLE IF NOT EXISTS "vgas_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL DEFAULT '{}',
    "owner_label" TEXT,
    "verify_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vgas_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "vgas_records_verify_code_key" ON "vgas_records"("verify_code");
CREATE INDEX IF NOT EXISTS "vgas_records_organization_id_domain_idx" ON "vgas_records"("organization_id", "domain");
CREATE INDEX IF NOT EXISTS "vgas_records_organization_id_kind_idx" ON "vgas_records"("organization_id", "kind");
CREATE INDEX IF NOT EXISTS "vgas_records_organization_id_status_idx" ON "vgas_records"("organization_id", "status");
