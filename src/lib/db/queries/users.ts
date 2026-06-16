import { supabase } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(row: any) {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    skillScore: row.skill_score,
    targetScore: row.target_score,
    bestStreak: row.best_streak,
    onboardingCompleted: row.onboarding_completed,
    startComposite: row.start_composite,
    currentComposite: row.current_composite,
    currentReadingWriting: row.current_reading_writing,
    currentMath: row.current_math,
    totalXp: row.total_xp,
    timezone: row.timezone,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getUserByClerkId(clerkId: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .limit(1)
    .single();

  return data ? mapUser(data) : null;
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}) {
  const { data: row } = await supabase
    .from("users")
    .upsert(
      {
        clerk_id: data.clerkId,
        email: data.email,
        display_name: data.displayName ?? null,
        avatar_url: data.avatarUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id" }
    )
    .select()
    .single();

  return row ? mapUser(row) : null;
}

export async function updateUser(
  clerkId: string,
  data: Partial<{
    displayName: string;
    avatarUrl: string;
    skillScore: number;
    bestStreak: number;
    onboardingCompleted: boolean;
    startComposite: number;
    currentComposite: number;
    currentReadingWriting: number;
    currentMath: number;
    totalXp: number;
    timezone: string;
  }>
) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.displayName !== undefined) update.display_name = data.displayName;
  if (data.avatarUrl !== undefined) update.avatar_url = data.avatarUrl;
  if (data.skillScore !== undefined) update.skill_score = data.skillScore;
  if (data.bestStreak !== undefined) update.best_streak = data.bestStreak;
  if (data.onboardingCompleted !== undefined) update.onboarding_completed = data.onboardingCompleted;
  if (data.startComposite !== undefined) update.start_composite = data.startComposite;
  if (data.currentComposite !== undefined) update.current_composite = data.currentComposite;
  if (data.currentReadingWriting !== undefined) update.current_reading_writing = data.currentReadingWriting;
  if (data.currentMath !== undefined) update.current_math = data.currentMath;
  if (data.totalXp !== undefined) update.total_xp = data.totalXp;
  if (data.timezone !== undefined) update.timezone = data.timezone;

  const { data: row } = await supabase
    .from("users")
    .update(update)
    .eq("clerk_id", clerkId)
    .select()
    .single();

  return row ? mapUser(row) : null;
}
