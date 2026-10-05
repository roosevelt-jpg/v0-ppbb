-- AlterTable
ALTER TABLE "cms_site_settings" ADD COLUMN "header_logo_url" TEXT NOT NULL DEFAULT '/email/verbalab-logo.png';
ALTER TABLE "cms_site_settings" ADD COLUMN "footer_logo_url" TEXT NOT NULL DEFAULT '/email/verbalab-mark.png';
ALTER TABLE "cms_site_settings" ADD COLUMN "favicon_url" TEXT NOT NULL DEFAULT '/email/verbalab-mark.png';
ALTER TABLE "cms_site_settings" ADD COLUMN "email_logo_url" TEXT NOT NULL DEFAULT '/email/verbalab-logo.png';
ALTER TABLE "cms_site_settings" ADD COLUMN "copyright_text" TEXT NOT NULL DEFAULT '';
