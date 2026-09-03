"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BillingView = {
  accessReason: "subscription" | "trial" | "expired";
  trialDaysRemaining: number;
  trialEndsAt: string;
  status: string;
  planInterval: "month" | "year" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
};

type PricingClientProps = {
  billing: BillingView;
  checkoutState?: string;
  sessionId?: string;
  setupPending?: boolean;
};

const plans = [
  {
    interval: "month" as const,
    name: "Monthly",
    price: "$49",
    cadence: "per month",
    description: "Flexible month-to-month LSAT preparation.",
  },
  {
    interval: "year" as const,
    name: "Annual",
    price: "$348",
    cadence: "per year",
    description: "Equivalent to $29/month when billed annually.",
    badge: "Save $240",
  },
];

async function responseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // Use the fallback for non-JSON errors.
  }
  return fallback;
}

export function PricingClient({
  billing,
  checkoutState,
  sessionId,
  setupPending = false,
}: PricingClientProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "month" | "year" | "portal" | "confirm" | null
  >(sessionId && !setupPending ? "confirm" : null);

  useEffect(() => {
    if (!sessionId || setupPending) return;

    const controller = new AbortController();

    async function confirmCheckout() {
      try {
        const response = await fetch("/api/billing/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            await responseError(response, "Unable to confirm your subscription.")
          );
        }

        toast.success("Subscription activated. Welcome to Athena.");
        router.replace("/dashboard");
        router.refresh();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to confirm your subscription."
        );
        setPendingAction(null);
      }
    }

    void confirmCheckout();
    return () => controller.abort();
  }, [router, sessionId, setupPending]);

  async function startCheckout(interval: "month" | "year") {
    setPendingAction(interval);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      if (!response.ok) {
        throw new Error(await responseError(response, "Unable to open Checkout."));
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("Stripe did not return a Checkout URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open Checkout.");
      setPendingAction(null);
    }
  }

  async function openPortal() {
    setPendingAction("portal");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      if (!response.ok) {
        throw new Error(
          await responseError(response, "Unable to open billing settings.")
        );
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("Stripe did not return a billing portal URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open billing settings."
      );
      setPendingAction(null);
    }
  }

  const subscribed = billing.accessReason === "subscription";
  const trialing = billing.accessReason === "trial";

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Athena Membership
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Keep your LSAT preparation moving
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          One membership unlocks every lesson, adaptive practice set, progress
          report, full test, and Mentor workspace.
        </p>
      </section>

      {pendingAction === "confirm" && (
        <div className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-3 rounded-md border bg-card px-5 py-4 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Confirming your Stripe subscription…
        </div>
      )}

      {setupPending && (
        <div className="mx-auto mt-8 max-w-2xl rounded-md border border-accent/40 bg-accent/10 px-5 py-4 text-center text-sm">
          Billing setup is being finalized. Your existing Athena access remains
          unchanged until the database migration is applied.
        </div>
      )}

      {checkoutState === "cancelled" && (
        <div className="mx-auto mt-8 max-w-xl rounded-md border bg-card px-5 py-4 text-center text-sm text-muted-foreground">
          Checkout was cancelled. Your account was not charged.
        </div>
      )}

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {plans.map((plan) => {
          const currentPlan = subscribed && billing.planInterval === plan.interval;
          return (
            <article
              key={plan.interval}
              className={`lsat-panel relative flex flex-col p-6 sm:p-8 ${
                plan.interval === "year" ? "lsat-panel-highlight" : ""
              }`}
            >
              {plan.badge && (
                <span className="absolute right-5 top-5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  {plan.badge}
                </span>
              )}
              <p className="text-sm font-semibold text-primary">{plan.name}</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">
                  {plan.cadence}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {[
                  "All adaptive LSAT practice",
                  "Interactive lessons and Mentor",
                  "Full tests and performance analytics",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                size="lg"
                variant={plan.interval === "year" ? "default" : "outline"}
                disabled={pendingAction !== null || subscribed || setupPending}
                onClick={() => void startCheckout(plan.interval)}
              >
                {pendingAction === plan.interval && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {currentPlan
                  ? "Current plan"
                  : subscribed
                    ? "Manage below"
                    : `Choose ${plan.name.toLowerCase()}`}
              </Button>
            </article>
          );
        })}
      </div>

      <section className="mt-6 rounded-lg border bg-card/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="font-semibold">
            {setupPending
              ? "Membership activation is pending."
              : subscribed
              ? `Your ${billing.planInterval === "year" ? "annual" : "monthly"} membership is active.`
              : trialing
                ? `${billing.trialDaysRemaining} trial day${billing.trialDaysRemaining === 1 ? "" : "s"} remaining.`
                : "Your seven-day trial has ended."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {setupPending
              ? "No payment action is available until billing storage is ready."
              : subscribed && billing.currentPeriodEnd
              ? `${billing.cancelAtPeriodEnd ? "Access continues until" : "Next billing date"} ${new Date(
                  billing.currentPeriodEnd
                ).toLocaleDateString()}.`
              : trialing
                ? `Full access continues through ${new Date(
                    billing.trialEndsAt
                  ).toLocaleDateString()}.`
                : "Choose a plan to restore access to the Athena workspace."}
          </p>
        </div>
        {billing.hasCustomer && !setupPending && (
          <Button
            variant="outline"
            className="mt-4 w-full sm:mt-0 sm:w-auto"
            disabled={pendingAction !== null}
            onClick={() => void openPortal()}
          >
            {pendingAction === "portal" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Manage billing
          </Button>
        )}
      </section>

      <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
        Payments are securely processed by Stripe. Cancel or update your plan
        from the billing portal at any time.
      </p>
    </main>
  );
}
