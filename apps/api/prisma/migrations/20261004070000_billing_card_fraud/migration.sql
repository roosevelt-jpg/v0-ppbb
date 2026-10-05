-- Stripe card-on-file + fraud hold fields for auto-debit and abuse blocking
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_default_payment_method_id" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "card_brand" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "card_last4" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "payment_failure_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "fraud_hold_at" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "last_checkout_at" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "checkout_attempt_count" INTEGER NOT NULL DEFAULT 0;
