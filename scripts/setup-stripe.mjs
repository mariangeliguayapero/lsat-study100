import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey?.startsWith("sk_test_")) {
  throw new Error(
    "stripe:setup only runs with a Stripe test-mode secret key in STRIPE_SECRET_KEY."
  );
}

const stripe = new Stripe(secretKey, {
  appInfo: { name: "Athena LSAT Prep", version: "0.1.0" },
});

const products = await stripe.products.list({ active: true, limit: 100 });
let product = products.data.find(
  (candidate) => candidate.metadata.athena_product === "membership"
);

if (!product) {
  product = await stripe.products.create({
    name: "Athena LSAT Membership",
    description:
      "Full access to Athena lessons, adaptive practice, Mentor, analytics, and LSAT practice tests.",
    metadata: { athena_product: "membership" },
  });
}

const prices = await stripe.prices.list({
  active: true,
  product: product.id,
  limit: 100,
});

async function ensurePrice({ interval, amount, lookupKey }) {
  const existing = prices.data.find(
    (price) =>
      price.currency === "usd" &&
      price.unit_amount === amount &&
      price.recurring?.interval === interval
  );

  if (existing) return existing;

  return stripe.prices.create({
    currency: "usd",
    unit_amount: amount,
    product: product.id,
    recurring: { interval },
    lookup_key: lookupKey,
    metadata: { athena_plan_interval: interval },
  });
}

const monthlyPrice = await ensurePrice({
  interval: "month",
  amount: 4900,
  lookupKey: "athena_monthly_49_usd",
});
const yearlyPrice = await ensurePrice({
  interval: "year",
  amount: 34800,
  lookupKey: "athena_annual_348_usd",
});

const configurations = await stripe.billingPortal.configurations.list({
  active: true,
  limit: 100,
});
let portalConfiguration = configurations.data.find(
  (candidate) => candidate.metadata?.athena_portal === "membership"
);

const portalFeatures = {
  customer_update: {
    enabled: true,
    allowed_updates: ["email", "name"],
  },
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: {
    enabled: true,
    mode: "at_period_end",
    cancellation_reason: {
      enabled: true,
      options: ["too_expensive", "unused", "missing_features", "other"],
    },
  },
  subscription_update: {
    enabled: true,
    default_allowed_updates: ["price"],
    proration_behavior: "create_prorations",
    products: [
      {
        product: product.id,
        prices: [monthlyPrice.id, yearlyPrice.id],
      },
    ],
  },
};

if (portalConfiguration) {
  portalConfiguration = await stripe.billingPortal.configurations.update(
    portalConfiguration.id,
    {
      name: "Athena membership portal",
      business_profile: { headline: "Manage your Athena membership" },
      features: portalFeatures,
    }
  );
} else {
  portalConfiguration = await stripe.billingPortal.configurations.create({
    name: "Athena membership portal",
    business_profile: { headline: "Manage your Athena membership" },
    features: portalFeatures,
    metadata: { athena_portal: "membership" },
  });
}

console.log("Stripe test catalog is ready. Add these values to .env.local:");
console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
console.log(`STRIPE_YEARLY_PRICE_ID=${yearlyPrice.id}`);
console.log(
  `STRIPE_BILLING_PORTAL_CONFIGURATION_ID=${portalConfiguration.id}`
);
