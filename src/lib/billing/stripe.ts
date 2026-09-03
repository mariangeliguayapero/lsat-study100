import "server-only";

import Stripe from "stripe";

export type BillingInterval = "month" | "year";

export const BILLING_PLANS = {
  month: {
    interval: "month" as const,
    amount: 4900,
    displayPrice: "$49",
    label: "Monthly",
  },
  year: {
    interval: "year" as const,
    amount: 34800,
    displayPrice: "$348",
    label: "Annual",
  },
};

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      appInfo: {
        name: "Athena LSAT Prep",
        version: "0.1.0",
      },
    });
  }

  return stripeClient;
}

export function getStripePriceId(interval: BillingInterval) {
  const priceId =
    interval === "month"
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;

  if (!priceId) {
    throw new Error(
      `Stripe ${interval} price is not configured. Run the Stripe setup script.`
    );
  }

  return priceId;
}

export function getAppUrl(requestOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return (configured || requestOrigin || "http://localhost:3000").replace(/\/$/, "");
}
