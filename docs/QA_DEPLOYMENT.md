# QA deployment checklist

Use a dedicated QA Vercel project, FastAPI agent service, Clerk instance, and
Supabase project or persistent branch. Never reuse production secrets or apply
the LSAT QA seed directly to production.

## 1. Vercel web application

Connect the QA Git branch to Vercel and use the repository `vercel.json`. Its
`pnpm qa:build` command stops the deployment when a required value is missing,
uses HTTP instead of HTTPS, or points a deployed service at localhost.

Set these variables for the Vercel Preview environment (and Production only if
this Vercel project is exclusively the stable QA deployment):

### Required

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`
- `NEXT_PUBLIC_SUPABASE_URL` - the isolated QA Supabase URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - the matching QA publishable key
- `SUPABASE_SECRET_KEY` - the matching QA server key. The legacy
  `SUPABASE_SERVICE_ROLE_KEY` name is also accepted, but do not configure both.
- `AGENT_SERVICE_URL` - the public HTTPS URL of the Render agent service, with
  no trailing endpoint path
- `APP_URL` - the stable HTTPS URL of this Vercel QA deployment

### Feature-dependent

- `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` for speech input/output
- `RESEND_API_KEY` and `EMAIL_FROM` for email notifications
- `NEXT_PUBLIC_CLARITY_ID` for Microsoft Clarity

Do not add `DATABASE_URL` to Vercel unless a future runtime feature explicitly
uses it. The current app accesses Supabase through its URL and keys.

After changing a Vercel environment variable, redeploy so build-time public
variables are embedded in the new build.

## 2. Render FastAPI agent

Create a Render **Web Service** from the same repository with:

- Root directory: `agents`
- Runtime: Docker
- Dockerfile: `Dockerfile` (relative to the `agents` root directory)
- Health check path: `/docs`
- Auto-deploy branch: the QA Git branch

The container binds to `0.0.0.0` and honors Render's injected `PORT`. For local
Docker use, it defaults to port `8080`; `docker-compose.yml` exposes that as
`localhost:8000`.

### Required Render variables

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_URL` - the same isolated QA Supabase project used by Vercel
- `SUPABASE_SERVICE_ROLE_KEY` - the matching QA service-role key
- `APP_URL` - the stable Vercel QA URL used in reminder links

### Feature-dependent Render variables

- `RESEND_API_KEY` and `EMAIL_FROM` for scheduled reminder emails

Render supplies `PORT`; do not hardcode it. Once Render is healthy, copy its
HTTPS service URL into Vercel as `AGENT_SERVICE_URL` and redeploy the web app.

## 3. Clerk configuration

- Use a QA/development Clerk instance, not the production instance.
- Add the stable Vercel QA domain to the Clerk application's allowed origins.
- Configure the QA domain for sign-in and sign-up redirects.
- Keep the after-sign-in and after-sign-up path set to `/onboarding`.
- Add the QA callback URL to the Google OAuth configuration when Google sign-in
  is enabled.
- Verify a new/incomplete user reaches onboarding and a completed user reaches
  the dashboard.

Prefer a stable QA domain over per-commit preview domains for authentication.

## 4. Supabase schema and LSAT content

Confirm the selected project reference is the QA project before running SQL.
Apply all files in `supabase/migrations/` in filename order. Then apply:

1. `supabase/seed_lsat_core_practice.sql`
2. `supabase/seed_lsat_content_depth.sql`
3. `supabase/seed_lsat_onboarding_questions.sql`

Optionally apply `supabase/seed_demo_full_lsat.sql` after the required seeds when
QA needs a complete demo exam. Detailed commands, expected counts, verification,
and rerun behavior are in `docs/LSAT_CONTENT_SEED.md`.

Before deploying, verify that the Supabase project reference in Vercel, Render,
and the SQL client is identical and is not the production reference.

## 5. Smoke tests

- Open the stable QA URL and confirm no browser or server request targets
  `localhost` or a production Supabase project.
- Sign up as a new user, complete onboarding, and reach the dashboard.
- Sign in as a completed user and confirm onboarding redirects to the dashboard.
- Load Dashboard, Daily Practice, Learn, Review, and Study Library data.
- Answer and submit a Daily Practice question.
- Open a lesson and verify AI generation and Mentor/Tutor SSE streaming complete.
- Start Full LSAT, answer a question, and verify resume/submission behavior.
- Verify empty and error states with a controlled account where practical.
- If configured, test speech input/output and a reminder email.
- Review Vercel and Render logs for missing variables, `401`, `500`, timeout, or
  upstream connection errors.
- Confirm production data was not created or modified during QA.

## Preflight commands

```bash
pnpm qa:verify-env
pnpm qa:build
pnpm exec tsc --noEmit
git diff --check
```

Run `pnpm qa:verify-env` only with the intended QA variables loaded. It is
designed to reject local URLs.
