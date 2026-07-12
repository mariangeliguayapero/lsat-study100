import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/queries/users";
import {
  upsertAnswer,
  updateAttemptPosition,
} from "@/lib/db/queries/full-sat";
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    attemptId,
    problemId,
    section,
    module,
    orderIndex,
    selectedOption,
    responseTimeMs,
  } = body as {
    attemptId: string;
    problemId: string;
    section: string;
    module: number;
    orderIndex: number;
    selectedOption: number;
    responseTimeMs?: number;
  };

  if (!attemptId || !problemId || !section || module == null || orderIndex == null || selectedOption == null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: problem, error } = await supabaseServer
    .from("problems")
    .select("correct_option")
    .eq("id", problemId)
    .single();

  if (error || !problem || problem.correct_option == null) {
    return NextResponse.json(
      { error: "Problem answer key not found" },
      { status: 404 }
    );
  }

  await upsertAnswer(attemptId, {
    problemId,
    section,
    module,
    orderIndex,
    selectedOption,
    isCorrect: selectedOption === problem.correct_option,
    responseTimeMs,
  });

  // Update resume position
  await updateAttemptPosition(attemptId, {
    currentSection: section,
    currentModule: module,
    currentQuestion: orderIndex,
  });

  return NextResponse.json({ ok: true });
}
