import { supabase } from "@/lib/supabase/client";

export async function getProfileData(userId: string) {
  const [
    userRes,
    quizSessionsRes,
    dailyQuestsRes,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, avatar_url, created_at, target_score, best_streak, current_composite")
      .eq("id", userId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("quiz_sessions")
      .select("id, score, total_questions, time_elapsed_seconds")
      .eq("user_id", userId)
      .eq("source", "sat"),
    supabase
      .from("daily_quests")
      .select("id, quest_date, score, total_questions, correct_count, time_elapsed_seconds")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("quest_date", { ascending: false }),
  ]);

  const userRecord = userRes.data;
  const quizSessions = quizSessionsRes.data ?? [];
  const dailyQuests = dailyQuestsRes.data ?? [];

  // Fetch answers for all legacy quiz sessions. Daily quests already store
  // their own aggregate correct/total counts.
  const sessionIds = quizSessions.map((s) => s.id);
  let totalAnswers = 0;
  let correctAnswers = 0;

  if (sessionIds.length > 0) {
    const { data: answers } = await supabase
      .from("quiz_answers")
      .select("is_correct")
      .in("session_id", sessionIds);

    totalAnswers = answers?.length ?? 0;
    correctAnswers = answers?.filter((a) => a.is_correct).length ?? 0;
  }

  const dailyQuestTotal = dailyQuests.reduce(
    (sum, q) => sum + q.total_questions,
    0
  );
  const dailyQuestCorrect = dailyQuests.reduce(
    (sum, q) => sum + q.correct_count,
    0
  );
  totalAnswers += dailyQuestTotal;
  correctAnswers += dailyQuestCorrect;

  const completedDates = new Set(dailyQuests.map((q) => q.quest_date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let offset = 0; offset < 365; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const dateStr = date.toISOString().split("T")[0];
    if (completedDates.has(dateStr)) {
      streak++;
    } else if (offset > 0 || completedDates.size === 0) {
      break;
    }
  }

  const currentComposite =
    userRecord?.current_composite != null &&
    userRecord.current_composite >= 120 &&
    userRecord.current_composite <= 180
      ? userRecord.current_composite
      : 120;
  const totalTimeSeconds =
    quizSessions.reduce((sum, s) => sum + s.time_elapsed_seconds, 0) +
    dailyQuests.reduce((sum, q) => sum + q.time_elapsed_seconds, 0);
  const accuracy =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  return {
    user: userRecord
      ? {
          displayName: userRecord.display_name,
          avatarUrl: userRecord.avatar_url,
          createdAt: new Date(userRecord.created_at),
          targetScore: userRecord.target_score,
          bestStreak: userRecord.best_streak,
        }
      : null,
    totalScore: currentComposite,
    questsDone: quizSessions.length + dailyQuests.length,
    totalTimeSeconds,
    accuracy,
    streak,
    bestStreak: Math.max(userRecord?.best_streak ?? 0, streak),
  };
}
