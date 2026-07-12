import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getAttemptAnswers, getUserAttempts } from "@/lib/db/queries/full-sat";
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

  const attempts = await getUserAttempts(user.id);
  const attemptsWithTotals = await Promise.all(
    attempts.map(async (attempt) => {
      if (attempt.status !== "completed") return attempt;

      const answers = await getAttemptAnswers(attempt.id);
      return {
        ...attempt,
        rwTotalQuestions: answers.filter((answer) => answer.section === "reading_writing").length,
        mathTotalQuestions: answers.filter((answer) => answer.section === "math").length,
      };
    })
  );

  return NextResponse.json({ attempts: attemptsWithTotals });
}
