import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/billing/stripe";
import { syncStripeSubscription } from "@/lib/db/queries/billing";
import { getUserByClerkId } from "@/lib/db/queries/users";

const confirmSchema = z.object({
  sessionId: z.string().startsWith("cs_"),
});

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = confirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Checkout session." }, { status: 400 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId, {
    expand: ["subscription"],
  });

  if (
    session.client_reference_id !== user.id ||
    session.metadata?.clerk_id !== clerkId
  ) {
    return NextResponse.json({ error: "Checkout session not found." }, { status: 404 });
  }

  if (!session.subscription || typeof session.subscription === "string") {
    return NextResponse.json(
      { error: "Subscription is not ready yet." },
      { status: 409 }
    );
  }

  const billing = await syncStripeSubscription(session.subscription, user.id);
  return NextResponse.json({ status: billing.status });
}

