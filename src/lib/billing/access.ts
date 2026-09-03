export const TRIAL_LENGTH_DAYS = 7;

export const PAID_ACCESS_STATUSES = new Set(["active", "trialing"]);

export type BillingRecord = {
  status: string;
  planInterval: "month" | "year" | null;
  trialStartedAt: Date;
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type BillingAccess = {
  hasAccess: boolean;
  reason: "subscription" | "trial" | "expired";
  trialDaysRemaining: number;
  trialEndsAt: string;
};

export function getBillingAccess(
  billing: BillingRecord,
  now = new Date()
): BillingAccess {
  if (PAID_ACCESS_STATUSES.has(billing.status)) {
    return {
      hasAccess: true,
      reason: "subscription",
      trialDaysRemaining: 0,
      trialEndsAt: billing.trialEndsAt.toISOString(),
    };
  }

  const remainingMs = billing.trialEndsAt.getTime() - now.getTime();
  if (remainingMs > 0) {
    return {
      hasAccess: true,
      reason: "trial",
      trialDaysRemaining: Math.ceil(remainingMs / (24 * 60 * 60 * 1000)),
      trialEndsAt: billing.trialEndsAt.toISOString(),
    };
  }

  return {
    hasAccess: false,
    reason: "expired",
    trialDaysRemaining: 0,
    trialEndsAt: billing.trialEndsAt.toISOString(),
  };
}

