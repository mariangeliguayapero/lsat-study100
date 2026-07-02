"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Brain,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

type ProgressData = {
  topicPerformance: TopicPerformance[];
  subtopicPerformance?: SubtopicPerformance[];
  recentSessions: RecentSession[];
  overallStats: {
    totalQuestions: number;
    accuracy: number;
    sessionCount: number;
  };
  topicMastery: {
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

function accuracyTone(accuracy: number, total: number) {
  if (total === 0) return "text-muted-foreground";
  if (accuracy < 50) return "text-red-400";
  if (accuracy < 70) return "text-amber-300";
  return "text-emerald-300";
}

function weakAreaGuidance(slug: string | null | undefined) {
  switch (slug) {
    case "flaw-questions":
      return "Review the exact reasoning gap: conclusion, evidence, then the assumption the author smuggles in.";
    case "assumption-questions":
      return "Practice identifying the missing bridge. For necessary assumptions, negate the answer and check whether the argument breaks.";
    case "strengthen-weaken":
      return "Focus on the pressure point. The right answer must change how well the evidence supports the conclusion.";
    case "main-point-structure":
      return "Summarize each paragraph by role, then choose an answer broad enough to cover the author’s central move.";
    case "inference-detail":
      return "Stay conservative. The supported answer should follow from the passage without adding a stronger claim.";
    default:
      return "Open the focused lesson, then drill a small set of similar questions before returning to mixed practice.";
  }
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
  const attemptedTopics =
    progress?.topicPerformance.filter((topic) => topic.total > 0).length ?? 0;
  const masteredCount = progress?.topicMastery.masteredCount ?? 0;
  const totalTopics = progress?.topicMastery.totalCount ?? 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8 space-y-3">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="h-9 w-64 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-72 rounded-lg bg-muted animate-pulse" />
          <div className="h-72 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <section className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Review
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Review Plan</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review missed patterns, rebuild weak areas, and turn recent practice
          into a tighter LSAT plan.
        </p>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="border bg-card/70 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Overall accuracy
          </div>
          <p className="text-4xl font-semibold">
            {progress?.overallStats.accuracy ?? 0}
            <span className="text-base text-muted-foreground">%</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {progress?.overallStats.totalQuestions ?? 0} questions attempted
          </p>
        </div>
        <div className="border bg-card/70 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Mastered topics
          </div>
          <p className="text-4xl font-semibold">
            {masteredCount}
            <span className="text-base text-muted-foreground">
              /{totalTopics}
            </span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {attemptedTopics} topic{attemptedTopics === 1 ? "" : "s"} with data
          </p>
        </div>
        <div className="border bg-card/70 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Current focus
          </div>
          <p className="line-clamp-1 text-xl font-semibold">
            {nextFocus?.name ?? "Start with daily practice"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {nextFocus
              ? `${nextFocus.topicName} - ${nextFocus.correct}/${nextFocus.total} correct, ${nextFocus.accuracy}% accuracy`
              : "Complete practice to unlock review targets"}
          </p>
        </div>
      </section>

      <section className="mb-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border bg-card/70 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Review Priorities</h2>
              <p className="text-sm text-muted-foreground">
                Your lowest-accuracy LSAT question types, ranked by what to fix first.
              </p>
            </div>
            <Brain className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {weakAreas.map((area) => {
              const topic = topics.find((t) => t.slug === area.topicSlug);
              const href = area.slug
                ? `/learning/${area.topicSlug}/${area.slug}/micro-lesson`
                : `/learning/${area.topicSlug}`;
              return (
                <Link
                  key={area.id}
                  href={href}
                  className="block border bg-background/40 p-4 transition-colors hover:bg-accent/30"
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
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {weakAreaGuidance(area.slug)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {area.correct}/{area.total} correct
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {area.slug
                        ? "Open focused lesson"
                        : `Review ${topic?.subtopics.length ?? 0} question types`}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              );
            })}

            {weakAreas.length === 0 && (
              <div className="border border-dashed p-6 text-sm text-muted-foreground">
                No review data yet. Complete daily practice or a topic quiz, then this
                panel will rank your review priorities.
              </div>
            )}
          </div>
        </div>

        <div className="border bg-card/70 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Recent Practice</h2>
              <p className="text-sm text-muted-foreground">
                Latest sessions feeding your review plan.
              </p>
            </div>
            <BookOpenCheck className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {(progress?.recentSessions ?? []).slice(0, 5).map((session) => {
              const accuracy =
                session.totalQuestions > 0
                  ? Math.round((session.score / session.totalQuestions) * 100)
                  : 0;
              return (
                <div
                  key={session.id}
                  className="border-b pb-3 last:border-b-0 last:pb-0"
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

            {(progress?.recentSessions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Recent LSAT sessions will appear after your first quiz or daily
                practice set.
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Review Library</h2>
            <p className="text-sm text-muted-foreground">
              Open a section to drill lessons, quizzes, and micro-lessons.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSubject(s.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activeSubject === s.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredTopics.map((topic) => {
            const Icon = getTopicIcon(topic.slug);
            const perf = topicPerfBySlug.get(topic.slug);
            return (
              <Link key={topic.id} href={`/learning/${topic.slug}`}>
                <Card className="h-full transition-colors hover:bg-accent/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-muted">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {topic.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {topic.subtopics.length} subtopic
                          {topic.subtopics.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {topic.overview}
                    </p>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {topic.estimatedTotalMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {topic.satRelevance.percentageOfTest}% of LSAT
                      </span>
                    </div>
                    {perf && perf.total > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Accuracy
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              accuracyTone(perf.accuracy, perf.total)
                            )}
                          >
                            {perf.accuracy}%
                          </span>
                        </div>
                        <AccuracyBar value={perf.accuracy} />
                      </div>
                    ) : (
                      <p className="pt-1 text-xs text-muted-foreground">
                        Not practiced yet
                      </p>
                    )}
                  </CardContent>
                </Card>
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
