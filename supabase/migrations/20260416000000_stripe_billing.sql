CREATE TABLE IF NOT EXISTS "billing_subscriptions" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"stripe_customer_id" text UNIQUE,
	"stripe_subscription_id" text UNIQUE,
	"status" text DEFAULT 'inactive' NOT NULL,
	"plan_interval" text,
	"trial_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trial_ends_at" timestamp with time zone DEFAULT (now() + interval '7 days') NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_status_check" CHECK (
		"status" IN (
			'inactive',
			'incomplete',
			'incomplete_expired',
			'trialing',
			'active',
			'past_due',
			'canceled',
			'unpaid',
			'paused'
		)
	),
	CONSTRAINT "billing_subscriptions_plan_interval_check" CHECK (
		"plan_interval" IS NULL OR "plan_interval" IN ('month', 'year')
	),
	CONSTRAINT "billing_subscriptions_user_id_users_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
		ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO "billing_subscriptions" ("user_id")
SELECT "id" FROM "users"
ON CONFLICT ("user_id") DO NOTHING;

CREATE OR REPLACE FUNCTION create_billing_subscription_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	INSERT INTO "billing_subscriptions" ("user_id")
	VALUES (NEW."id")
	ON CONFLICT ("user_id") DO NOTHING;
	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_create_billing_subscription ON "users";
CREATE TRIGGER users_create_billing_subscription
	AFTER INSERT ON "users"
	FOR EACH ROW
	EXECUTE FUNCTION create_billing_subscription_for_user();

ALTER TABLE "billing_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stripe_webhook_events" ENABLE ROW LEVEL SECURITY;
