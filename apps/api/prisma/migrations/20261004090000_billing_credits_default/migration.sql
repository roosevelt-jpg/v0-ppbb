-- Align default monthly credit pool with ElevenLabs Free (10k credits).
ALTER TABLE "organizations" ALTER COLUMN "character_quota" SET DEFAULT 10000;
