import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Scale } from "lucide-react";
import { NavUser } from "@/components/layout/nav-user";
import { PricingClient } from "@/components/billing/pricing-client";
import { getBillingAccess } from "@/lib/billing/access";
import { ensureBillingSubscription } from "@/lib/db/queries/billing";
import { getUserByClerkId } from "@/lib/db/queries/users";

type PricingPageProps = {
  searchParams: Promise<{
    checkout?: string;
    session_id?: string;
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in?redirect_url=/pricing");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/dashboard");

  const query = await searchParams;
  let setupPending = false;
  let billingView: {
    accessReason: "subscription" | "trial" | "expired";
    trialDaysRemaining: number;
    trialEndsAt: string;
    status: string;
    planInterval: "month" | "year" | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasCustomer: boolean;
  };

  try {
    const billing = await ensureBillingSubscription(user.id);
    const access = getBillingAccess(billing);
    billingView = {
      accessReason: access.reason,
      trialDaysRemaining: access.trialDaysRemaining,
      trialEndsAt: access.trialEndsAt,
      status: billing.status,
      planInterval: billing.planInterval,
      currentPeriodEnd: billing.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
      hasCustomer: Boolean(billing.stripeCustomerId),
    };
  } catch (error) {
    console.warn("Athena billing storage is not ready", error);
    setupPending = true;
    billingView = {
      accessReason: "trial",
      trialDaysRemaining: 0,
      trialEndsAt: new Date().toISOString(),
      status: "inactive",
      planInterval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasCustomer: false,
    };
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border bg-primary/10 text-primary">
              <Scale className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.25em]">
                Athena
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Membership
              </span>
            </span>
          </Link>
          <NavUser />
        </div>
      </header>
      <PricingClient
        checkoutState={query.checkout}
        sessionId={query.session_id}
        setupPending={setupPending}
        billing={billingView}
      />
    </div>
  );
}
