# Hetzner Supabase Cutover

Athena's production database lives in the dedicated `lsat` schema of the
shared self-hosted Supabase instance. Never commit endpoint credentials,
database passwords, JWTs, or connection strings.

## Application configuration

Configure these values in the Hetzner deployment environment:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://supabase.study100.academy
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<instance anon key>
SUPABASE_SECRET_KEY=<instance service-role key>
NEXT_PUBLIC_SUPABASE_DB_SCHEMA=lsat
```

The browser and server Supabase clients use
`NEXT_PUBLIC_SUPABASE_DB_SCHEMA`. It defaults to `public` so existing local
environments remain compatible.

## Required server configuration

Before Athena can use the schema through the Data API, the Supabase operator
must add `lsat` to PostgREST's exposed schemas. For the standard self-hosted
Docker configuration, add it to `PGRST_DB_SCHEMAS` and restart the REST
service. Keep the instance's existing exposed schemas.

Example:

```dotenv
PGRST_DB_SCHEMAS=public,storage,graphql_public,lsat
```

Confirm the API no longer returns `PGRST106` for requests with
`Accept-Profile: lsat` before deploying Athena.

## Applying migrations

Obtain a complete PostgreSQL connection URI from the server operator. A
Supabase HTTPS URL and database password alone are insufficient; the username,
host, port, database, and SSL mode must match the deployment.

The centralized server has one global `supabase_migrations` history shared by
all apps. Athena therefore uses its own `lsat.schema_migrations` history and
the native PostgreSQL client, so another app's migration versions cannot cause
Athena migrations to be skipped.

Set the connection URI only in the shell environment, then run:

```bash
export HETZNER_SUPABASE_DB_URL='<postgresql-connection-uri>'
pnpm db:migrate:lsat
```

Each file is applied in its own transaction and recorded only after success.
The migrations create all Athena objects under `lsat`, establish Supabase role
grants/default privileges, and keep other application schemas untouched. The
full migration chain has been replayed successfully against a clean isolated
PostgreSQL database with Supabase-compatible roles and auth helpers.

## Verification

After migration and PostgREST restart:

1. Query an `lsat` table through the Data API with `Accept-Profile: lsat`.
2. Generate fresh Supabase TypeScript types for the `lsat` schema.
3. Run TypeScript, lint, build, and billing tests.
4. Start Athena against the new environment and complete account sync,
   onboarding, study-flow, trial, Checkout, webhook, and billing-portal QA.
5. Rotate any service-role key or database password shared through chat before
   production launch.

## Shared-instance security

The standard Supabase `service_role` key bypasses RLS across the instance. On
a shared multi-application installation, prefer an app-specific server role
or separate Supabase project/stack if strict isolation is required. Never
expose the service-role key to browser code.
