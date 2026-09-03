import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBillingAccess } from "@/lib/billing/access";
import {
  getAppUrl,
  getStripe,
  getStripePriceId,
} from "@/lib/billing/stripe";
import {
  ensureBillingSubscription,
  updateBillingSubscription,
} from "@/lib/db/queries/billing";
import { getUserByClerkId } from "@/lib/db/queries/users";

const checkoutSchema = z.object({
  interval: z.enum(["month", "year"]),
});

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a monthly or annual plan." },
      { status: 400 }
    );
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const billing = await ensureBillingSubscription(user.id);
  const access = getBillingAccess(billing);
  if (access.reason === "subscription") {
    return NextResponse.json(
      { error: "You already have an active subscription." },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  let customerId = billing.stripeCustomerId;

  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) customerId = null;
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName ?? undefined,
      metadata: {
        athena_user_id: user.id,
        clerk_id: clerkId,
      },
    });
    customerId = customer.id;
    await updateBillingSubscription(user.id, {
      stripeCustomerId: customerId,
    });
  }

  const appUrl = getAppUrl(request.nextUrl.origin);
  const interval = parsed.data.interval;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: getStripePriceId(interval), quantity: 1 }],
    success_url: `${appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: {
      athena_user_id: user.id,
      clerk_id: clerkId,
      plan_interval: interval,
    },
    subscription_data: {
      metadata: {
        athena_user_id: user.id,
        clerk_id: clerkId,
        plan_interval: interval,
      },
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a Checkout URL." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
