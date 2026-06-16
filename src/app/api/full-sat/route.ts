import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/queries/users";
import {
  getActiveTests,
  getLastCompletedAttempt,
  getInProgressAttempt,
} from "@/lib/db/queries/full-sat";
import { FULL_SAT_COOLDOWN_MS } from "@/types/full-sat";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [tests, lastAttempt, currentAttempt] = await Promise.all([
    getActiveTests(),
    getLastCompletedAttempt(user.id),
    getInProgressAttempt(user.id),
  ]);

  let canTakeTest = true;
  let nextAvailableDate: string | null = null;

  if (lastAttempt?.completedAt) {
    const completedTime = new Date(lastAttempt.completedAt).getTime();
    const nextTime = completedTime + FULL_SAT_COOLDOWN_MS;
    if (Date.now() < nextTime) {
      canTakeTest = false;
      nextAvailableDate = new Date(nextTime).toISOString();
    }
  }

  return NextResponse.json({
    tests,
    lastAttempt: lastAttempt
      ? {
          completedAt: lastAttempt.completedAt,
          totalScore: lastAttempt.totalScore,
          testId: lastAttempt.testId,
        }
      : null,
    canTakeTest,
    nextAvailableDate,
    currentAttempt,
  });
}
