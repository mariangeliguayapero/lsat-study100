import "server-only";

import type Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";
import type { BillingRecord } from "@/lib/billing/access";

type BillingRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan_interval: string | null;
  trial_started_at: string;
  trial_ends_at: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type BillingSubscription = BillingRecord & {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapBillingSubscription(row: BillingRow): BillingSubscription {
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    planInterval:
      row.plan_interval === "month" || row.plan_interval === "year"
        ? row.plan_interval
        : null,
    trialStartedAt: new Date(row.trial_started_at),
    trialEndsAt: new Date(row.trial_ends_at),
    currentPeriodEnd: row.current_period_end
      ? new Date(row.current_period_end)
      : null,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getBillingSubscription(userId: string) {
  const { data, error } = await supabaseServer
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapBillingSubscription(data as BillingRow) : null;
}

export async function ensureBillingSubscription(userId: string) {
  const existing = await getBillingSubscription(userId);
  if (existing) return existing;

  const { data, error } = await supabaseServer
    .from("billing_subscriptions")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return mapBillingSubscription(data as BillingRow);
}

export async function getBillingSubscriptionByCustomerId(customerId: string) {
  const { data, error } = await supabaseServer
    .from("billing_subscriptions")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapBillingSubscription(data as BillingRow) : null;
}

export async function updateBillingSubscription(
  userId: string,
  values: Partial<{
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    status: string;
    planInterval: "month" | "year" | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }>
) {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (values.stripeCustomerId !== undefined) {
    update.stripe_customer_id = values.stripeCustomerId;
  }
  if (values.stripeSubscriptionId !== undefined) {
    update.stripe_subscription_id = values.stripeSubscriptionId;
  }
  if (values.status !== undefined) update.status = values.status;
  if (values.planInterval !== undefined) {
    update.plan_interval = values.planInterval;
  }
  if (values.currentPeriodEnd !== undefined) {
    update.current_period_end = values.currentPeriodEnd?.toISOString() ?? null;
  }
  if (values.cancelAtPeriodEnd !== undefined) {
    update.cancel_at_period_end = values.cancelAtPeriodEnd;
  }

  const { data, error } = await supabaseServer
    .from("billing_subscriptions")
    .update(update)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapBillingSubscription(data as BillingRow);
}

function stripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  explicitUserId?: string
) {
  const customerId = stripeId(subscription.customer);
  const mapped = customerId
    ? await getBillingSubscriptionByCustomerId(customerId)
    : null;
  const userId =
    explicitUserId || subscription.metadata.athena_user_id || mapped?.userId;

  if (!userId) {
    throw new Error(
      `Unable to map Stripe subscription ${subscription.id} to an Athena user.`
    );
  }

  const item = subscription.items.data[0];
  const interval = item?.price.recurring?.interval;
  const normalizedInterval = interval ? String(interval) : null;
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;

  return updateBillingSubscription(userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    planInterval:
      normalizedInterval === "month" || normalizedInterval === "year"
        ? normalizedInterval
        : null,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

export async function hasProcessedStripeEvent(eventId: string) {
  const { data, error } = await supabaseServer
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function markStripeEventProcessed(event: Stripe.Event) {
  const { error } = await supabaseServer.from("stripe_webhook_events").upsert({
    id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString(),
  });

  if (error) throw error;
}
