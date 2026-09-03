# Stripe Billing

Athena uses a time-based membership gate:

- Every user receives seven days of full access.
- After the trial expires, protected pages redirect to `/pricing` and protected
  application APIs return HTTP `402`.
- An active Stripe subscription restores access.
- Plans are USD $49/month and USD $348/year. The annual plan is equivalent to
  $29/month and saves $240 compared with paying monthly for one year.

## Local configuration

The application expects these variables in `.env.local`:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_MONTHLY_PRICE_ID=
STRIPE_YEARLY_PRICE_ID=
STRIPE_BILLING_PORTAL_CONFIGURATION_ID=
STRIPE_WEBHOOK_SECRET=
```

Never commit real values. `.env.local` is ignored by Git.

Create or reuse the Athena test product, recurring prices, and billing portal:

```bash
pnpm stripe:setup
pnpm stripe:verify
```

## Database migration

Apply `supabase/migrations/20260416000000_stripe_billing.sql` before enabling
billing. It creates:

- `billing_subscriptions`, including the seven-day trial window and Stripe IDs;
- `stripe_webhook_events` for webhook idempotency;
- a trigger that creates a billing row for every new Athena user;
- a backfill that gives existing users a fresh seven-day rollout trial.

The application intentionally fails open if the billing table is temporarily
unavailable, preventing a database deployment problem from taking Athena
offline. The pricing page and Checkout APIs still require the migration.

## Local webhooks

Load the ignored local environment and start the Stripe CLI against the same
test account:

```bash
set -a
source .env.local
set +a
stripe listen \
  --api-key "$STRIPE_SECRET_KEY" \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted \
  --forward-to localhost:3000/api/billing/webhook
```

Copy the displayed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`, restart the
Next.js process, and listen for:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The Checkout success page also confirms the subscription directly. This makes
the browser redirect reliable while the webhook remains the durable source of
truth for later renewals, cancellations, and payment-state changes.

## Verification

```bash
pnpm test:billing
pnpm exec tsc --noEmit --incremental false
pnpm build
```

Test Checkout using Stripe test payment methods only. Verify monthly and annual
Checkout, cancellation, plan switching, and the expired-trial redirect before
enabling production credentials.
