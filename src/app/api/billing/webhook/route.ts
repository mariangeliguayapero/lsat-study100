import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import {
  hasProcessedStripeEvent,
  markStripeEventProcessed,
  syncStripeSubscription,
} from "@/lib/db/queries/billing";

export const runtime = "nodejs";

async function handleEvent(event: Stripe.Event) {
  if (await hasProcessedStripeEvent(event.id)) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription) {
        const stripe = getStripe();
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncStripeSubscription(
          subscription,
          session.metadata?.athena_user_id
        );
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncStripeSubscription(event.data.object);
      break;
    default:
      break;
  }

  await markStripeEventProcessed(event);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 }
    );
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  try {
    await handleEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Unable to process Stripe webhook", error);
    return NextResponse.json(
      { error: "Unable to process Stripe webhook." },
      { status: 500 }
    );
  }
}
