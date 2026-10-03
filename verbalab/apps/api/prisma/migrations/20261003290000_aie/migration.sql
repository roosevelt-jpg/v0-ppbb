-- Volume 23 AI Economy records
CREATE TABLE IF NOT EXISTS "aie_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL DEFAULT '{}',
    "owner_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aie_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "aie_records_organization_id_domain_idx" ON "aie_records"("organization_id", "domain");
CREATE INDEX IF NOT EXISTS "aie_records_organization_id_kind_idx" ON "aie_records"("organization_id", "kind");
CREATE INDEX IF NOT EXISTS "aie_records_organization_id_status_idx" ON "aie_records"("organization_id", "status");
