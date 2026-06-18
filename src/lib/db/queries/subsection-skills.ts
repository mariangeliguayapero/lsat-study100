import { supabase } from "@/lib/supabase/client";
import type { SubsectionSkill, SectionCategory } from "@/types/adaptive";
import type { Database } from "@/types/supabase";

const LSAT_SUBJECTS = ["logical-reasoning", "reading-comprehension", "analytical-reasoning"];
type SubsectionSkillInsert = Database["public"]["Tables"]["subsection_skills"]["Insert"];

function mapSkill(row: Record<string, unknown>): SubsectionSkill {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    subtopicId: row.subtopic_id as string,
    sectionCategory: row.section_category as SectionCategory,
    level: row.level as number,
    xp: row.xp as number,
    totalAttempts: row.total_attempts as number,
    correctAttempts: row.correct_attempts as number,
    last10: (row.last_10 as boolean[]) ?? [],
    streakCorrect: row.streak_correct as number,
    streakWrong: row.streak_wrong as number,
    lastSeenAt: row.last_seen_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function getLsatSubtopicIdSet(): Promise<Set<string>> {
  const { data } = await supabase
    .from("subtopics")
    .select("id, topics!inner(subject)")
    .in("topics.subject", LSAT_SUBJECTS);

  return new Set((data ?? []).map((row) => row.id));
}

export async function getSubsectionSkill(
  userId: string,
  subtopicId: string
): Promise<SubsectionSkill | null> {
  const { data } = await supabase
    .from("subsection_skills")
    .select("*")
    .eq("user_id", userId)
    .eq("subtopic_id", subtopicId)
    .limit(1)
    .single();

  return data ? mapSkill(data) : null;
}

export async function getAllSubsectionSkills(
  userId: string
): Promise<SubsectionSkill[]> {
  const { data } = await supabase
    .from("subsection_skills")
    .select("*")
    .eq("user_id", userId)
    .order("level", { ascending: true });

  const allowedSubtopicIds = await getLsatSubtopicIdSet();
  return (data ?? [])
    .filter((row: Record<string, unknown>) => allowedSubtopicIds.has(row.subtopic_id as string))
    .map(mapSkill);
}

export async function getSubsectionSkillsBySection(
  userId: string,
  sectionCategory: SectionCategory
): Promise<SubsectionSkill[]> {
  const { data } = await supabase
    .from("subsection_skills")
    .select("*")
    .eq("user_id", userId)
    .eq("section_category", sectionCategory)
    .order("level", { ascending: true });

  const allowedSubtopicIds = await getLsatSubtopicIdSet();
  return (data ?? [])
    .filter((row: Record<string, unknown>) => allowedSubtopicIds.has(row.subtopic_id as string))
    .map(mapSkill);
}

export async function upsertSubsectionSkill(
  userId: string,
  subtopicId: string,
  sectionCategory: SectionCategory,
  updates: Partial<{
    level: number;
    xp: number;
    totalAttempts: number;
    correctAttempts: number;
    last10: boolean[];
    streakCorrect: number;
    streakWrong: number;
    lastSeenAt: string;
  }>
): Promise<SubsectionSkill> {
  const row: SubsectionSkillInsert = {
    user_id: userId,
    subtopic_id: subtopicId,
    section_category: sectionCategory,
    updated_at: new Date().toISOString(),
  };

  if (updates.level !== undefined) row.level = updates.level;
  if (updates.xp !== undefined) row.xp = updates.xp;
  if (updates.totalAttempts !== undefined) row.total_attempts = updates.totalAttempts;
  if (updates.correctAttempts !== undefined) row.correct_attempts = updates.correctAttempts;
  if (updates.last10 !== undefined) row.last_10 = updates.last10;
  if (updates.streakCorrect !== undefined) row.streak_correct = updates.streakCorrect;
  if (updates.streakWrong !== undefined) row.streak_wrong = updates.streakWrong;
  if (updates.lastSeenAt !== undefined) row.last_seen_at = updates.lastSeenAt;

  const { data, error } = await supabase
    .from("subsection_skills")
    .upsert(row, { onConflict: "user_id,subtopic_id" })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to upsert subsection skill");
  return mapSkill(data);
}

export async function initializeAllSkills(userId: string): Promise<SubsectionSkill[]> {
  // Fetch LSAT subtopics with their topic's subject.
  const { data: subtopics } = await supabase
    .from("subtopics")
    .select("id, topic_id, topics!inner(subject)")
    .in("topics.subject", LSAT_SUBJECTS)
    .order("order_index");

  if (!subtopics || subtopics.length === 0) return [];

  // Check which skills already exist
  const { data: existing } = await supabase
    .from("subsection_skills")
    .select("subtopic_id")
    .eq("user_id", userId);

  const existingIds = new Set(
    (existing ?? []).map((row: { subtopic_id: string }) => row.subtopic_id)
  );

  const toInsert = subtopics
    .filter((s) => !existingIds.has(s.id))
    .map((s) => {
      const topic = s.topics as unknown as { subject: string };
      const subject = topic?.subject ?? "logical-reasoning";
      const sectionCategory =
        subject === "reading-comprehension" ? "ReadingWriting" : "Math";
      return {
        user_id: userId,
        subtopic_id: s.id,
        section_category: sectionCategory,
      };
    });

  if (toInsert.length === 0) {
    return getAllSubsectionSkills(userId);
  }

  const { error } = await supabase.from("subsection_skills").insert(toInsert);
  if (error) throw new Error(error.message);

  return getAllSubsectionSkills(userId);
}
