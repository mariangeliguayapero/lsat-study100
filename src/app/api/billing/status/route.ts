import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBillingAccess } from "@/lib/billing/access";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { ensureBillingSubscription } from "@/lib/db/queries/billing";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const billing = await ensureBillingSubscription(user.id);
  const access = getBillingAccess(billing);

  return NextResponse.json({
    access,
    subscription: {
      status: billing.status,
      planInterval: billing.planInterval,
      currentPeriodEnd: billing.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
      hasCustomer: Boolean(billing.stripeCustomerId),
    },
  });
}

