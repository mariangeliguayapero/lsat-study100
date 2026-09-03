import assert from "node:assert/strict";
import test from "node:test";
import { getBillingAccess, type BillingRecord } from "./access";

function billing(overrides: Partial<BillingRecord> = {}): BillingRecord {
  return {
    status: "inactive",
    planInterval: null,
    trialStartedAt: new Date("2026-09-01T00:00:00.000Z"),
    trialEndsAt: new Date("2026-09-08T00:00:00.000Z"),
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

test("grants access during the seven-day Athena trial", () => {
  const result = getBillingAccess(
    billing(),
    new Date("2026-09-01T12:00:00.000Z")
  );

  assert.equal(result.hasAccess, true);
  assert.equal(result.reason, "trial");
  assert.equal(result.trialDaysRemaining, 7);
});

test("expires access when the local trial ends", () => {
  const result = getBillingAccess(
    billing(),
    new Date("2026-09-08T00:00:00.000Z")
  );

  assert.equal(result.hasAccess, false);
  assert.equal(result.reason, "expired");
  assert.equal(result.trialDaysRemaining, 0);
});

test("an active Stripe subscription overrides an expired trial", () => {
  const result = getBillingAccess(
    billing({ status: "active", planInterval: "month" }),
    new Date("2026-10-01T00:00:00.000Z")
  );

  assert.equal(result.hasAccess, true);
  assert.equal(result.reason, "subscription");
});

test("a canceled subscription falls back to trial expiration", () => {
  const result = getBillingAccess(
    billing({ status: "canceled" }),
    new Date("2026-10-01T00:00:00.000Z")
  );

  assert.equal(result.hasAccess, false);
  assert.equal(result.reason, "expired");
});

