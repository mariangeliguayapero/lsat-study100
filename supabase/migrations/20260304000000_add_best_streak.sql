SET search_path TO "lsat";

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "best_streak" integer DEFAULT 0 NOT NULL;
