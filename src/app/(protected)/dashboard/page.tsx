"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  MessageSquareText,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { DailyQuestCard } from "@/components/dashboard/daily-quest-card";
import { ParticlesBackground } from "@/components/particles-background";
import { cn } from "@/lib/utils";

type StreakDay = {
  day: string;
  completed: boolean;
  isPast: boolean;
};

type DashboardData = {
  user: {
    displayName: string | null;
    skillScore: number | null;
    avatarUrl: string | null;
    targetScore: number | null;
  };
  completedSessions: number;
  streak: number;
  totalScore: number;
  weeklyDelta: number;
  weeklyStreakDays: StreakDay[];
  todayStudyTime: string | null;
  targetScore: number | null;
};

type ProgressData = {
  scoreHistory: { date: string; score: number }[];
  subtopicPerformance: {
    id: string;
    name: string;
    slug: string;
    topicName: string;
    topicSlug: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  overallStats: {
    totalQuestions: number;
    accuracy: number;
    totalTimeSeconds: number;
    sessionCount: number;
  };
  sectionScores: {
    readingWriting: {
      total: number;
      correct: number;
      accuracy: number;
      scaledScore: number;
    };
    math: {
      total: number;
      correct: number;
      accuracy: number;
      scaledScore: number;
    };
  };
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function scoreBand(score: number) {
  if (score >= 170) return "170+ readiness";
  if (score >= 165) return "Top-score range";
  if (score >= 160) return "Strong applicant range";
  if (score >= 150) return "Competitive foundation";
  if (score >= 140) return "Developing foundation";
  return "Starting range";
}

function estimatedPercentile(score: number) {
  if (score >= 175) return "99th+";
  if (score >= 170) return "97th";
  if (score >= 165) return "92nd";
  if (score >= 160) return "80th";
  if (score >= 155) return "67th";
  if (score >= 150) return "50th";
  if (score >= 145) return "35th";
  if (score >= 140) return "25th";
  if (score >= 130) return "10th";
  return "<10th";
}

function formatStudyTime(time: string | null) {
  if (!time) return "Not scheduled";
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText ?? "00"} ${suffix}`;
}

function ScoreProgressCard({
  currentScore,
  targetScore,
  percentile,
  band,
}: {
  currentScore: number;
  targetScore: number;
  percentile: string;
  band: string;
}) {
  const gap = Math.max(0, targetScore - currentScore);
  const progress = Math.min(
    100,
    Math.max(0, Math.round(((currentScore - 120) / 60) * 100))
  );
  const targetProgress = Math.min(
    100,
    Math.max(0, ((targetScore - 120) / 60) * 100)
  );

  return (
    <div className="lsat-panel lsat-panel-highlight h-full p-6 lg:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Score Progress
          </p>
          <div className="mt-3 flex items-end gap-4">
            <p className="text-5xl font-semibold tabular-nums">{currentScore}</p>
            <div className="pb-1">
              <p className="text-sm font-medium">{band}</p>
              <p className="text-xs text-muted-foreground">
                Estimated {percentile} percentile
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-left md:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Target
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{targetScore}</p>
          <p className="text-xs text-muted-foreground">
            {gap === 0 ? "Target reached" : `${gap} points to close`}
          </p>
        </div>
      </div>
      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>120</span>
          <span className="font-semibold text-primary">
            Current {currentScore}
          </span>
          <span>180</span>
        </div>
        <div
          className="relative h-3 bg-primary/10"
          role="progressbar"
          aria-label="Estimated LSAT score progress"
          aria-valuemin={120}
          aria-valuemax={180}
          aria-valuenow={currentScore}
        >
          <div
            className="h-full bg-primary/65 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
          <span
            aria-hidden="true"
            className="absolute -top-1 h-5 w-px bg-accent shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            style={{ left: `${targetProgress}%` }}
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-sm"
            style={{ left: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{gap === 0 ? "Target reached" : `${gap} points remaining`}</span>
          <span>Target marker: {targetScore}</span>
        </div>
      </div>
    </div>
  );
}

function SectionAccuracy({
  label,
  accuracy,
  correct,
  total,
}: {
  label: string;
  accuracy: number;
  correct: number;
  total: number;
}) {
  return (
    <div className="lsat-panel-soft border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {total > 0 ? `${correct}/${total} correct` : "No attempts yet"}
          </p>
        </div>
        <p className="text-2xl font-semibold tabular-nums">{accuracy}%</p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden bg-muted">
        <div
          className="h-full bg-primary"
          style={{ width: `${Math.max(0, Math.min(100, accuracy))}%` }}
        />
      </div>
    </div>
  );
}

function PracticeHeatmap({
  days,
  studyTime,
  completedSets,
}: {
  days: StreakDay[];
  studyTime: string;
  completedSets: number;
}) {
  const practiced = days.filter((day) => day.completed).length;

  return (
    <div className="lsat-panel h-full p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Practice Consistency
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {practiced} day{practiced === 1 ? "" : "s"} practiced this week
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Study time {studyTime} · {completedSets} completed sets
          </p>
        </div>
        <CalendarDays className="h-5 w-5 text-primary" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div key={`${day.day}-${index}`} className="space-y-2">
            <div
              className={cn(
                "h-10 border",
                day.completed
                  ? "border-primary/70 bg-primary/70 shadow-[0_0_18px_rgba(81,207,214,0.16)]"
                  : day.isPast
                    ? "border-border bg-muted/25"
                    : "border-dashed border-border bg-background/30"
              )}
              title={`${day.day}: ${day.completed ? "practiced" : "no practice"}`}
            />
            <p className="text-center text-[10px] text-muted-foreground">
              {day.day}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Consistency is measured by completed daily practice sets and recent study activity.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: userData, loading: userLoading } = useCurrentUser();

  const readyToLoad =
    !userLoading && !!userData && userData.user.onboardingCompleted;

  const {
    data,
    isLoading: dashLoading,
    isError,
  } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () =>
      fetch("/api/dashboard").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 60_000,
    enabled: readyToLoad,
  });

  const { data: progress, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ["progress"],
    queryFn: () =>
      fetch("/api/progress").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 60_000,
    enabled: readyToLoad,
  });

  useEffect(() => {
    if (!userLoading && userData && !userData.user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [userData, userLoading, router]);

  useEffect(() => {
    if (isError) toast.error("Failed to load dashboard data");
  }, [isError]);

  const loading = userLoading || dashLoading || progressLoading;

  const currentScore = useMemo(() => {
    const latestHistory = progress?.scoreHistory.at(-1)?.score;
    if (latestHistory && latestHistory >= 120 && latestHistory <= 180) {
      return latestHistory;
    }
    if (data?.totalScore && data.totalScore >= 120 && data.totalScore <= 180) {
      return data.totalScore;
    }
    if (
      data?.user.skillScore &&
      data.user.skillScore >= 120 &&
      data.user.skillScore <= 180
    ) {
      return data.user.skillScore;
    }
    return 120;
  }, [data, progress]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="h-8 w-64 animate-pulse bg-muted" />
        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          <div className="h-32 animate-pulse bg-muted" />
          <div className="h-32 animate-pulse bg-muted" />
          <div className="h-32 animate-pulse bg-muted" />
          <div className="h-32 animate-pulse bg-muted" />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="h-80 animate-pulse bg-muted" />
          <div className="h-80 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const targetScore = data.user.targetScore ?? data.targetScore ?? 170;
  const lr = progress?.sectionScores.math ?? {
    total: 0,
    correct: 0,
    accuracy: 0,
    scaledScore: 120,
  };
  const rc = progress?.sectionScores.readingWriting ?? {
    total: 0,
    correct: 0,
    accuracy: 0,
    scaledScore: 120,
  };
  const weakAreas =
    progress?.subtopicPerformance.filter((area) => area.total > 0).slice(0, 2) ?? [];
  const nextReview = weakAreas[0];
  const displayName = data.user.displayName?.split(" ")[0] ?? "Student";
  const completedSets = progress?.overallStats.sessionCount ?? data.completedSessions;
  const studyTime = formatStudyTime(data.todayStudyTime);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className="relative z-10 p-5 lg:p-8">
        <motion.div
          className="mx-auto max-w-7xl"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.header
            variants={staggerItem}
            className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                LSAT Command Center
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Welcome back, {displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                See the next best action for today, from adaptive practice to targeted review.
              </p>
            </div>
          </motion.header>

          <motion.section
            variants={staggerItem}
            className="grid items-stretch gap-5 lg:grid-cols-2"
          >
            <ScoreProgressCard
              currentScore={currentScore}
              targetScore={targetScore}
              percentile={estimatedPercentile(currentScore)}
              band={scoreBand(currentScore)}
            />
            <PracticeHeatmap
              days={data.weeklyStreakDays}
              studyTime={studyTime}
              completedSets={completedSets}
            />
          </motion.section>

          <motion.div
            variants={staggerContainer}
            className="mt-5 grid items-stretch gap-5 lg:grid-cols-2"
          >
              <motion.section variants={staggerItem} className="lsat-panel h-full p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Section Performance
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">LSAT area accuracy</h2>
                  </div>
                  <Link
                    href="/queue"
                    className="inline-flex items-center gap-2 text-sm text-primary"
                  >
                    View progress
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <SectionAccuracy
                    label="Logical Reasoning"
                    accuracy={lr.accuracy}
                    correct={lr.correct}
                    total={lr.total}
                  />
                  <SectionAccuracy
                    label="Reading Comprehension"
                    accuracy={rc.accuracy}
                    correct={rc.correct}
                    total={rc.total}
                  />
                </div>
              </motion.section>

              <motion.section variants={staggerItem} className="lsat-panel h-full p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Today&apos;s Focus
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">Next review action</h2>
                  </div>
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>

                {nextReview ? (
                  <div className="lsat-panel-soft border p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">{nextReview.name}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {nextReview.topicName} · {nextReview.correct}/{nextReview.total} correct.
                          Review the concept, then test it in a short focused set.
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                        {nextReview.accuracy}% accuracy
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/learning/${nextReview.topicSlug}/${nextReview.slug}/quiz`}
                        className="lsat-cta-primary inline-flex items-center gap-2 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        Start focused practice
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <Link
                        href="/learning"
                        className="lsat-cta-secondary inline-flex items-center gap-2 border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        View review plan
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Complete a practice set to generate a targeted review action.
                    </p>
                    <Link href="/study-library" className="text-sm font-semibold text-primary hover:underline">
                      Browse Study Library
                    </Link>
                  </div>
                )}
              </motion.section>

              <motion.div variants={staggerItem} className="h-full [&>*]:h-full">
                <DailyQuestCard />
              </motion.div>

              <motion.div variants={staggerItem} className="lsat-panel lsat-panel-highlight h-full p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Study Planning
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">Ask your LSAT mentor</h2>
                  </div>
                  <MessageSquareText className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Turn your latest accuracy data into a focused plan for Logical Reasoning and Reading Comprehension.
                </p>
                <Link
                  href="/mentor"
                  className="lsat-cta-secondary mt-5 inline-flex items-center gap-2 border px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/50"
                >
                  Build study plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
