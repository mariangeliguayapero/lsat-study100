import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getProgressData } from "@/lib/db/queries/progress";
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

  const data = await getProgressData(user.id);

  return NextResponse.json({
    user: {
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      targetScore: user.targetScore ?? null,
      skillScore: user.skillScore ?? null,
    },
    ...data,
  });
}
