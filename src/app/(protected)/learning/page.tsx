"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Brain,
  Clock,
  PlayCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { getTopicIcon } from "@/lib/topic-icons";
import { cn } from "@/lib/utils";

type Topic = {
  id: string;
  slug: string;
  name: string;
  overview: string;
  estimatedTotalMinutes: number;
  satRelevance: { percentageOfTest: number };
  subtopics: { id: string }[];
  subject: string;
};

type TopicPerformance = {
  name: string;
  slug: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
};

type SubtopicPerformance = {
  id: string;
  name: string;
  slug: string;
  topicName: string;
  topicSlug: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
};

type RecentSession = {
  id: string;
  subtopicName: string;
  score: number;
  totalQuestions: number;
  timeElapsedSeconds: number;
  date: string;
};

type SectionScore = {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
  scaledScore: number;
};

type ProgressData = {
  user: {
    targetScore: number | null;
    skillScore: number | null;
  };
  targetScore: number | null;
  topicPerformance: TopicPerformance[];
  subtopicPerformance?: SubtopicPerformance[];
  recentSessions: RecentSession[];
  overallStats: {
    totalQuestions: number;
    accuracy: number;
    sessionCount: number;
  };
  sectionScores: {
    readingWriting: SectionScore;
    math: SectionScore;
  };
  topicMastery: {
    items: {
      name: string;
      mastered: boolean;
      attempted: boolean;
    }[];
    masteredCount: number;
    totalCount: number;
  };
};

type LearningData = { topics: Topic[] };

const SUBJECTS = [
  { key: "logical-reasoning", label: "Logical Reasoning" },
  { key: "reading-comprehension", label: "Reading Comprehension" },
] as const;

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function estimatePercentile(score: number): string {
  if (score >= 175) return "99th+";
  if (score >= 170) return "96th-98th";
  if (score >= 165) return "90th-95th";
  if (score >= 160) return "80th-89th";
  if (score >= 155) return "65th-79th";
  if (score >= 150) return "45th-64th";
  if (score >= 145) return "30th-44th";
  if (score >= 140) return "18th-29th";
  return "Below 18th";
}

function scoreBand(score: number): string {
  if (score >= 170) return "Law school ready";
  if (score >= 165) return "Competitive";
  if (score >= 160) return "Strong foundation";
  if (score >= 150) return "Developing";
  return "Baseline";
}

function accuracyTone(accuracy: number, total: number) {
  if (total === 0) return "text-muted-foreground";
  if (accuracy < 50) return "text-red-400";
  if (accuracy < 70) return "text-amber-300";
  return "text-emerald-300";
}

function weakAreaGuidance(slug: string | null | undefined) {
  switch (slug) {
    case "flaw-questions":
      return "Flaw questions are high-leverage because they train you to name exactly why an argument fails before answer choices distract you.";
    case "assumption-questions":
      return "Assumption work builds the core LR habit: finding the missing bridge between evidence and conclusion.";
    case "strengthen-weaken":
      return "Strengthen and weaken questions reward pressure-point thinking, which transfers directly into most LR families.";
    case "main-point-structure":
      return "Main point and structure work improves passage mapping, timing, and answer elimination on Reading Comprehension.";
    case "inference-detail":
      return "Inference/detail practice keeps RC answers grounded in the passage instead of tempting stronger outside claims.";
    default:
      return "This is the best current review target based on completed practice. Start with a short lesson, then drill a focused set.";
  }
}

function recommendedNextStep(area: SubtopicPerformance | undefined) {
  if (!area) return "Complete a daily practice set to unlock a personalized review plan.";
  if (area.accuracy < 60) return "Open the lesson, then complete a focused practice set.";
  return "Run a focused practice set and review every missed answer.";
}

function AccuracyBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden bg-muted">
      <div
        className="h-full bg-primary transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Target;
}) {
  return (
    <div className="border border-border/70 bg-card/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-5 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function LearningPage() {
  const [activeSubject, setActiveSubject] = useState<string>(
    "logical-reasoning"
  );

  const {
    data,
    isLoading: loading,
    isError,
  } = useQuery<{ learning: LearningData; progress: ProgressData }>({
    queryKey: ["review"],
    queryFn: async () => {
      const [learningRes, progressRes] = await Promise.all([
        fetch("/api/learning"),
        fetch("/api/progress"),
      ]);

      if (!learningRes.ok || !progressRes.ok) {
        throw new Error("Failed to load review data");
      }

      const [learning, progress] = await Promise.all([
        learningRes.json(),
        progressRes.json(),
      ]);

      return { learning, progress };
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load review data");
  }, [isError]);

  const topics = data?.learning.topics ?? [];
  const progress = data?.progress;

  const filteredTopics = topics.filter((t) => t.subject === activeSubject);

  const topicPerfBySlug = useMemo(() => {
    const map = new Map<string, TopicPerformance>();
    for (const item of progress?.topicPerformance ?? []) {
      map.set(item.slug, item);
    }
    return map;
  }, [progress?.topicPerformance]);

  const weakAreas = useMemo(() => {
    const subtopicWeakAreas = [...(progress?.subtopicPerformance ?? [])]
      .filter((subtopic) => subtopic.total > 0)
      .sort((a, b) => {
        if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
        return b.total - a.total;
      })
      .slice(0, 4);

    if (subtopicWeakAreas.length > 0) return subtopicWeakAreas;

    return [...(progress?.topicPerformance ?? [])]
      .filter((topic) => topic.total > 0)
      .sort((a, b) => {
        if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
        return b.total - a.total;
      })
      .slice(0, 4)
      .map((topic) => ({
        id: topic.slug,
        name: topic.name,
        slug: "",
        topicName: topic.name,
        topicSlug: topic.slug,
        subject: topic.subject,
        total: topic.total,
        correct: topic.correct,
        accuracy: topic.accuracy,
      }));
  }, [progress?.subtopicPerformance, progress?.topicPerformance]);

  const nextFocus = weakAreas[0];
  const averageAccuracy = progress
    ? (progress.sectionScores.readingWriting.accuracy +
        progress.sectionScores.math.accuracy) /
      2
    : 0;
  const estimatedScore = Math.round(120 + (averageAccuracy / 100) * 60);
  const masteredTopics =
    progress?.topicMastery.items.filter((topic) => topic.mastered) ?? [];
  const recentSessions = progress?.recentSessions.slice(0, 3) ?? [];

  const focusLessonHref = nextFocus?.slug
    ? `/learning/${nextFocus.topicSlug}/${nextFocus.slug}/micro-lesson`
    : nextFocus
      ? `/learning/${nextFocus.topicSlug}`
      : "/quest";
  const focusPracticeHref = nextFocus?.slug
    ? `/learning/${nextFocus.topicSlug}/${nextFocus.slug}/quiz`
    : nextFocus
      ? `/learning/${nextFocus.topicSlug}`
      : "/quest";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8 space-y-3">
          <div className="h-4 w-28 animate-pulse bg-muted" />
          <div className="h-9 w-64 animate-pulse bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-80 animate-pulse bg-muted" />
          <div className="h-80 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 pb-16 md:p-6">
      <section className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
          LSAT Review
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Review Plan</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Turn recent misses into a clear next action: isolate the pattern, study the concept, then drill a small focused set.
        </p>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Estimated Score"
          value={estimatedScore}
          detail={`${scoreBand(estimatedScore)} · ${estimatePercentile(estimatedScore)} percentile`}
          icon={TrendingUp}
        />
        <SummaryCard
          label="Score Context"
          value={scoreBand(estimatedScore)}
          detail={`Estimated percentile: ${estimatePercentile(estimatedScore)}`}
          icon={Target}
        />
        <SummaryCard
          label="Weakest Area"
          value={nextFocus?.name ?? "No data yet"}
          detail={nextFocus ? `${nextFocus.accuracy}% in ${nextFocus.topicName}` : "Complete practice to identify one"}
          icon={AlertTriangle}
        />
        <SummaryCard
          label="Recommended Step"
          value={nextFocus ? "Focused review" : "Start practice"}
          detail={recommendedNextStep(nextFocus)}
          icon={PlayCircle}
        />
      </section>

      <section className="mb-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="border border-primary/35 bg-card/90 p-6 shadow-[0_0_40px_rgba(20,184,166,0.08)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Current Focus
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                {nextFocus?.name ?? "Build your first review target"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {nextFocus
                  ? `${nextFocus.topicName} · ${nextFocus.subject === "logical-reasoning" ? "Logical Reasoning" : "Reading Comprehension"}`
                  : "Complete a daily practice set or topic quiz to activate your review plan."}
              </p>
            </div>
            {nextFocus && (
              <div className="min-w-36 border border-border/70 bg-background/40 p-4 text-right">
                <p className={cn("text-3xl font-bold tabular-nums", accuracyTone(nextFocus.accuracy, nextFocus.total))}>
                  {nextFocus.accuracy}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nextFocus.correct}/{nextFocus.total} correct
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-border/70 pt-5">
            <p className="text-sm font-medium">Why this matters</p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {weakAreaGuidance(nextFocus?.slug)}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={focusPracticeHref}
              className="inline-flex h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <PlayCircle className="h-4 w-4" />
              Start focused practice
            </Link>
            <Link
              href={focusLessonHref}
              className="inline-flex h-11 items-center justify-center gap-2 border border-border bg-background/50 px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <BookOpen className="h-4 w-4" />
              Open lesson
            </Link>
          </div>
        </div>

        <div className="border border-border/70 bg-card/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Mastered Topics</h2>
              <p className="text-sm text-muted-foreground">
                Topics where recent accuracy is at or above mastery threshold.
              </p>
            </div>
            <Brain className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {masteredTopics.length > 0 ? (
              masteredTopics.map((topic) => (
                <span
                  key={topic.name}
                  className="border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  {topic.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No mastered topics yet. Keep completing focused sets to establish reliable strengths.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-border/70 bg-card/80 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Review Priorities</h2>
              <p className="text-sm text-muted-foreground">
                Lowest-accuracy question types ranked by what to review first.
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>

          <div className="space-y-3">
            {weakAreas.map((area) => {
              const href = area.slug
                ? `/learning/${area.topicSlug}/${area.slug}/micro-lesson`
                : `/learning/${area.topicSlug}`;
              return (
                <Link
                  key={area.id}
                  href={href}
                  className="block border border-border/70 bg-background/35 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{area.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {area.topicName}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        accuracyTone(area.accuracy, area.total)
                      )}
                    >
                      {area.accuracy}%
                    </span>
                  </div>
                  <AccuracyBar value={area.accuracy} />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {area.correct}/{area.total} correct
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Open micro-lesson
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              );
            })}

            {weakAreas.length === 0 && (
              <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                No review data yet. Complete daily practice or a topic quiz, then this panel will rank your review priorities.
              </div>
            )}
          </div>
        </div>

        <div className="border border-border/70 bg-card/80 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Recent Practice</h2>
              <p className="text-sm text-muted-foreground">
                Latest attempts that shaped this review plan.
              </p>
            </div>
            <BookOpenCheck className="h-5 w-5 text-primary" />
          </div>

          <div className="space-y-3">
            {recentSessions.map((session) => {
              const accuracy =
                session.totalQuestions > 0
                  ? Math.round((session.score / session.totalQuestions) * 100)
                  : 0;
              return (
                <div
                  key={session.id}
                  className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        {session.subtopicName || "LSAT practice"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSessionDate(session.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {session.score}/{session.totalQuestions}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          accuracyTone(accuracy, session.totalQuestions)
                        )}
                      >
                        {accuracy}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {recentSessions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Recent LSAT sessions will appear after your first quiz or daily practice set.
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Focused Study Library</h2>
            <p className="text-sm text-muted-foreground">
              Use this only when you want to choose a section manually instead of following the current focus.
            </p>
          </div>
          <div className="inline-flex h-10 shrink-0 items-center gap-1 border border-border/70 bg-card/80 p-1">
            {SUBJECTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSubject(s.key)}
                className={cn(
                  "inline-flex h-8 items-center justify-center whitespace-nowrap px-3 text-xs font-medium transition md:px-4",
                  activeSubject === s.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredTopics.map((topic) => {
            const Icon = getTopicIcon(topic.slug);
            const perf = topicPerfBySlug.get(topic.slug);
            return (
              <Link
                key={topic.id}
                href={`/learning/${topic.slug}`}
                className="border border-border/70 bg-card/80 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-muted">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold">{topic.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {topic.subtopics.length} question type{topic.subtopics.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {perf && perf.total > 0 && (
                        <span className={cn("text-sm font-semibold", accuracyTone(perf.accuracy, perf.total))}>
                          {perf.accuracy}%
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {topic.overview}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {topic.estimatedTotalMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {topic.satRelevance.percentageOfTest}% of LSAT
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No LSAT topics available yet for this section.
          </p>
        )}
      </section>
    </div>
  );
}
