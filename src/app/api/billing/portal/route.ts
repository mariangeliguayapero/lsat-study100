import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/lib/billing/stripe";
import { ensureBillingSubscription } from "@/lib/db/queries/billing";
import { getUserByClerkId } from "@/lib/db/queries/users";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const billing = await ensureBillingSubscription(user.id);
  if (!billing.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account exists for this user." },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const appUrl = getAppUrl(request.nextUrl.origin);
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${appUrl}/pricing`,
    configuration:
      process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID || undefined,
  });

  return NextResponse.json({ url: session.url });
}

