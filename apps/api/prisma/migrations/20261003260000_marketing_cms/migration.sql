-- Marketing CMS (site settings, pages, blocks, assets)

CREATE TABLE "cms_site_settings" (
    "id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL DEFAULT 'VerbaLab',
    "tagline" TEXT NOT NULL DEFAULT '',
    "default_theme" TEXT NOT NULL DEFAULT 'system',
    "primary_color" TEXT NOT NULL DEFAULT '#1a6b52',
    "accent_color" TEXT NOT NULL DEFAULT '#6fcf9c',
    "design_scope" JSONB NOT NULL DEFAULT '{}',
    "social_links" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_site_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cms_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'published',
    "seo" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages"("slug");

CREATE TABLE "cms_blocks" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL DEFAULT '{}',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cms_blocks_page_id_sort_order_idx" ON "cms_blocks"("page_id", "sort_order");

CREATE TABLE "cms_assets" (
    "id" TEXT NOT NULL,
    "page_id" TEXT,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'image',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cms_assets_key_key" ON "cms_assets"("key");
CREATE INDEX "cms_assets_page_id_idx" ON "cms_assets"("page_id");

ALTER TABLE "cms_blocks" ADD CONSTRAINT "cms_blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "cms_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cms_assets" ADD CONSTRAINT "cms_assets_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "cms_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
