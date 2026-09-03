import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBillingAccess } from "@/lib/billing/access";
import { getBillingSubscription } from "@/lib/db/queries/billing";
import { getUserByClerkId } from "@/lib/db/queries/users";

const isProtectedRoute = createRouteMatcher([
  "/onboarding(.*)",
  "/dashboard(.*)",
  "/queue(.*)",
  "/my-learning(.*)",
  "/learning(.*)",
  "/profile(.*)",
  "/mentor(.*)",
  "/study-library(.*)",
  "/quest(.*)",
  "/full-sat(.*)",
  "/pricing(.*)",
]);

const paywalledPagePrefixes = [
  "/onboarding",
  "/dashboard",
  "/queue",
  "/my-learning",
  "/learning",
  "/profile",
  "/mentor",
  "/study-library",
  "/quest",
  "/full-sat",
];

const billingApiPrefixes = ["/api/billing", "/api/user", "/api/health"];

function isPaywalledRequest(pathname: string) {
  if (paywalledPagePrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return (
    pathname.startsWith("/api/") &&
    !billingApiPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  if (!isPaywalledRequest(req.nextUrl.pathname)) return;

  const { userId: clerkId } = await auth();
  if (!clerkId) return;

  try {
    const user = await getUserByClerkId(clerkId);
    if (!user) return;

    const billing = await getBillingSubscription(user.id);
    if (!billing || getBillingAccess(billing).hasAccess) return;

    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Your Athena trial has ended. Choose a plan to continue." },
        { status: 402 }
      );
    }

    const pricingUrl = new URL("/pricing", req.url);
    pricingUrl.searchParams.set("reason", "trial-expired");
    return NextResponse.redirect(pricingUrl);
  } catch (error) {
    // Do not take the application offline if billing storage is unavailable.
    console.warn("Unable to evaluate Athena billing access", error);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
