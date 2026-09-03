import assert from "node:assert/strict";
import Stripe from "stripe";

const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_MONTHLY_PRICE_ID",
  "STRIPE_YEARLY_PRICE_ID",
  "STRIPE_BILLING_PORTAL_CONFIGURATION_ID",
];

for (const name of required) {
  assert.ok(process.env[name], `Missing ${name}`);
}

assert.ok(
  process.env.STRIPE_SECRET_KEY.startsWith("sk_test_"),
  "stripe:verify only runs against Stripe test mode"
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  appInfo: { name: "Athena LSAT Prep", version: "0.1.0" },
});

const [monthly, yearly, portal] = await Promise.all([
  stripe.prices.retrieve(process.env.STRIPE_MONTHLY_PRICE_ID),
  stripe.prices.retrieve(process.env.STRIPE_YEARLY_PRICE_ID),
  stripe.billingPortal.configurations.retrieve(
    process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID
  ),
]);

assert.equal(monthly.active, true);
assert.equal(monthly.currency, "usd");
assert.equal(monthly.unit_amount, 4900);
assert.equal(monthly.recurring?.interval, "month");

assert.equal(yearly.active, true);
assert.equal(yearly.currency, "usd");
assert.equal(yearly.unit_amount, 34800);
assert.equal(yearly.recurring?.interval, "year");

assert.equal(portal.active, true);
assert.equal(portal.features.payment_method_update.enabled, true);
assert.equal(portal.features.subscription_cancel.enabled, true);
assert.equal(portal.features.subscription_cancel.mode, "at_period_end");
assert.equal(portal.features.subscription_update.enabled, true);

const portalProducts = portal.features.subscription_update.products;
if (portalProducts) {
  const portalPriceIds = portalProducts.flatMap((product) => product.prices);
  assert.ok(portalPriceIds.includes(monthly.id));
  assert.ok(portalPriceIds.includes(yearly.id));
}

console.log(
  "Stripe test catalog verified: $49/month, $348/year, billing portal enabled."
);
