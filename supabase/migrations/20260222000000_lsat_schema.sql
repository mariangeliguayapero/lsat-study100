CREATE SCHEMA IF NOT EXISTS "lsat";

CREATE TABLE IF NOT EXISTS "lsat"."schema_migrations" (
  "version" text PRIMARY KEY,
  "name" text NOT NULL,
  "applied_at" timestamp with time zone DEFAULT now() NOT NULL
);

GRANT USAGE ON SCHEMA "lsat" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "lsat" TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA "lsat" TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "lsat" TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "lsat"
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "lsat"
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "lsat"
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Migration bookkeeping is intentionally private to the database owner.
REVOKE ALL ON TABLE "lsat"."schema_migrations"
  FROM anon, authenticated, service_role;
