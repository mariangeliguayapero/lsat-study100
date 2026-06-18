import { supabase } from "@/lib/supabase/client";

const LSAT_SUBJECTS = [
  "logical-reasoning",
  "reading-comprehension",
  "analytical-reasoning",
];

type PracticeSession = {
  id: string;
  subtopic_id: string | null;
  score: number;
  total_questions: number;
  time_elapsed_seconds: number;
  created_at: string;
  kind: "quiz" | "daily-quest";
};

type PracticeAnswer = {
  id: string;
  session_id: string;
  problem_id: string;
  subtopic_id: string | null;
  is_correct: boolean;
};

type TopicInfo = {
  name: string;
  slug: string;
  subject: string;
  order_index: number;
};

function getAnswerSubtopicId(
  answer: PracticeAnswer,
  sessionMap: Record<string, PracticeSession>
) {
  return answer.subtopic_id ?? sessionMap[answer.session_id]?.subtopic_id ?? null;
}

function toLsatScore(correct: number, total: number) {
  if (total === 0) return 120;
  return Math.round(120 + (correct / total) * 60);
}

export async function getProgressData(userId: string) {
  const [quizSessionsRes, dailyQuestsRes, topicsRes] = await Promise.all([
    supabase
      .from("quiz_sessions")
      .select("id, subtopic_id, score, total_questions, time_elapsed_seconds, created_at")
      .eq("user_id", userId)
      .eq("source", "sat")
      .order("created_at", { ascending: true }),
    supabase
      .from("daily_quests")
      .select("id, quest_date, score, total_questions, correct_count, time_elapsed_seconds, created_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("quest_date", { ascending: true }),
    supabase
      .from("topics")
      .select("id, name, slug, subject, order_index")
      .in("subject", LSAT_SUBJECTS)
      .order("order_index", { ascending: true }),
  ]);

  const quizSessions = quizSessionsRes.data ?? [];
  const dailyQuests = dailyQuestsRes.data ?? [];
  const topics = topicsRes.data ?? [];

  const sessions: PracticeSession[] = [
    ...quizSessions.map((s) => ({
      id: s.id,
      subtopic_id: s.subtopic_id,
      score: s.score,
      total_questions: s.total_questions,
      time_elapsed_seconds: s.time_elapsed_seconds,
      created_at: s.created_at,
      kind: "quiz" as const,
    })),
    ...dailyQuests.map((q) => ({
      id: q.id,
      subtopic_id: null,
      score: q.correct_count,
      total_questions: q.total_questions,
      time_elapsed_seconds: q.time_elapsed_seconds,
      created_at: q.created_at,
      kind: "daily-quest" as const,
    })),
  ];

  const quizSessionIds = quizSessions.map((s) => s.id);
  const dailyQuestIds = dailyQuests.map((q) => q.id);

  const [quizAnswersRes, dailyQuestProblemsRes] = await Promise.all([
    quizSessionIds.length > 0
      ? supabase
          .from("quiz_answers")
          .select("id, session_id, problem_id, is_correct")
          .in("session_id", quizSessionIds)
      : Promise.resolve({ data: [] }),
    dailyQuestIds.length > 0
      ? supabase
          .from("daily_quest_problems")
          .select("id, quest_id, problem_id, subtopic_id, is_correct")
          .in("quest_id", dailyQuestIds)
          .not("is_correct", "is", null)
      : Promise.resolve({ data: [] }),
  ]);

  const answers: PracticeAnswer[] = [
    ...(quizAnswersRes.data ?? []).map((a) => ({
      id: a.id,
      session_id: a.session_id,
      problem_id: a.problem_id,
      subtopic_id: null,
      is_correct: a.is_correct,
    })),
    ...(dailyQuestProblemsRes.data ?? []).map((p) => ({
      id: p.id,
      session_id: p.quest_id,
      problem_id: p.problem_id,
      subtopic_id: p.subtopic_id,
      is_correct: Boolean(p.is_correct),
    })),
  ];

  const sessionMap: Record<string, PracticeSession> = {};
  for (const s of sessions) sessionMap[s.id] = s;

  const subtopicIds = [
    ...new Set(
      [
        ...sessions.map((s) => s.subtopic_id).filter(Boolean),
        ...answers.map((a) => a.subtopic_id).filter(Boolean),
      ] as string[]
    ),
  ];

  const problemIds = [...new Set(answers.map((a) => a.problem_id))];

  const [subtopicsRes, problemsRes] = await Promise.all([
    subtopicIds.length > 0
      ? supabase
          .from("subtopics")
          .select("id, topic_id, name")
          .in("id", subtopicIds)
      : Promise.resolve({ data: [] }),
    problemIds.length > 0
      ? supabase
          .from("problems")
          .select("id, difficulty")
          .in("id", problemIds)
      : Promise.resolve({ data: [] }),
  ]);

  const subtopics = subtopicsRes.data ?? [];
  const problemDifficultyMap: Record<string, string> = {};
  for (const p of problemsRes.data ?? []) {
    problemDifficultyMap[p.id] = p.difficulty;
  }

  const subtopicMap: Record<string, { topic_id: string; name: string }> = {};
  for (const st of subtopics) {
    subtopicMap[st.id] = { topic_id: st.topic_id, name: st.name };
  }

  const topicMap: Record<string, TopicInfo> = {};
  for (const t of topics) {
    topicMap[t.id] = {
      name: t.name,
      slug: t.slug,
      subject: t.subject,
      order_index: t.order_index,
    };
  }

  const dailyStats: Record<string, { total: number; correct: number }> = {};
  for (const answer of answers) {
    const session = sessionMap[answer.session_id];
    if (!session) continue;
    const date = session.created_at.split("T")[0];
    if (!dailyStats[date]) dailyStats[date] = { total: 0, correct: 0 };
    dailyStats[date].total++;
    if (answer.is_correct) dailyStats[date].correct++;
  }

  let cumulativeCorrect = 0;
  let cumulativeTotal = 0;
  const cumulativeScoreHistory = Object.entries(dailyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => {
      cumulativeCorrect += stats.correct;
      cumulativeTotal += stats.total;
      return { date, score: toLsatScore(cumulativeCorrect, cumulativeTotal) };
    });

  const difficultyStats: Record<string, { total: number; correct: number }> = {};
  for (const ans of answers) {
    const difficulty = problemDifficultyMap[ans.problem_id];
    if (!difficulty) continue;
    if (!difficultyStats[difficulty]) {
      difficultyStats[difficulty] = { total: 0, correct: 0 };
    }
    difficultyStats[difficulty].total++;
    if (ans.is_correct) difficultyStats[difficulty].correct++;
  }

  const accuracyByDifficulty = Object.entries(difficultyStats).map(
    ([difficulty, stats]) => ({
      difficulty,
      total: stats.total,
      correct: stats.correct,
      accuracy:
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    })
  );

  const topicPerfStats: Record<string, { total: number; correct: number }> = {};
  for (const ans of answers) {
    const subtopicId = getAnswerSubtopicId(ans, sessionMap);
    if (!subtopicId) continue;
    const subtopic = subtopicMap[subtopicId];
    if (!subtopic) continue;
    const topicId = subtopic.topic_id;
    if (!topicMap[topicId]) continue;
    if (!topicPerfStats[topicId]) topicPerfStats[topicId] = { total: 0, correct: 0 };
    topicPerfStats[topicId].total++;
    if (ans.is_correct) topicPerfStats[topicId].correct++;
  }

  const allTopicPerformance = topics.map((t) => {
    const perf = topicPerfStats[t.id];
    return {
      name: t.name,
      slug: t.slug,
      subject: t.subject,
      total: perf?.total ?? 0,
      correct: perf?.correct ?? 0,
      accuracy:
        perf && perf.total > 0
          ? Math.round((perf.correct / perf.total) * 100)
          : 0,
    };
  });

  const recentSessions = [...sessions]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10)
    .map((s) => ({
      id: s.id,
      subtopicName:
        s.kind === "daily-quest"
          ? "Daily LSAT Quest"
          : s.subtopic_id
            ? subtopicMap[s.subtopic_id]?.name ?? ""
            : "",
      score: s.score,
      totalQuestions: s.total_questions,
      timeElapsedSeconds: s.time_elapsed_seconds,
      date: s.created_at,
    }));

  const totalQ = answers.length;
  const totalCorrect = answers.filter((a) => a.is_correct).length;
  const totalTime = sessions.reduce(
    (sum, s) => sum + s.time_elapsed_seconds,
    0
  );
  const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
  const sessionCount = sessions.length;

  const sectionStats: Record<string, { total: number; correct: number }> = {};
  for (const ans of answers) {
    const subtopicId = getAnswerSubtopicId(ans, sessionMap);
    if (!subtopicId) continue;
    const subtopic = subtopicMap[subtopicId];
    if (!subtopic) continue;
    const topic = topicMap[subtopic.topic_id];
    if (!topic) continue;
    const subject =
      topic.subject === "reading-comprehension"
        ? "reading-comprehension"
        : "logical-reasoning";
    if (!sectionStats[subject]) sectionStats[subject] = { total: 0, correct: 0 };
    sectionStats[subject].total++;
    if (ans.is_correct) sectionStats[subject].correct++;
  }

  const makeSection = (subject: string) => {
    const stats = sectionStats[subject] ?? { total: 0, correct: 0 };
    const accuracy =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return {
      subject,
      total: stats.total,
      correct: stats.correct,
      accuracy,
      scaledScore: toLsatScore(stats.correct, stats.total),
    };
  };

  const topicMasteryList = topics.map((t) => {
    const perf = topicPerfStats[t.id];
    const total = perf?.total ?? 0;
    const correct = perf?.correct ?? 0;
    const mastered = total >= 5 && correct / total >= 0.7;
    return {
      name: t.name,
      mastered,
      attempted: total > 0,
    };
  });

  return {
    scoreHistory: cumulativeScoreHistory,
    accuracyByDifficulty,
    topicPerformance: allTopicPerformance,
    recentSessions,
    overallStats: {
      totalQuestions: totalQ,
      accuracy: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0,
      totalTimeSeconds: totalTime,
      sessionCount,
      avgScore: sessionCount > 0 ? Math.round(totalScore / sessionCount) : 0,
    },
    sectionScores: {
      readingWriting: makeSection("reading-comprehension"),
      math: makeSection("logical-reasoning"),
    },
    topicMastery: {
      items: topicMasteryList,
      masteredCount: topicMasteryList.filter((s) => s.mastered).length,
      totalCount: topicMasteryList.length,
    },
  };
}
