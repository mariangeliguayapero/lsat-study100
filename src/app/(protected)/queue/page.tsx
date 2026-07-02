"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Clock, Target, TrendingUp } from "lucide-react";

type FilterRange = "week" | "month" | "all";

type ProgressData = {
  user: {
    displayName: string | null;
    avatarUrl: string | null;
    targetScore: number | null;
    skillScore: number | null;
  };
  targetScore: number | null;
  scoreHistory: { date: string; score: number }[];
  topicPerformance: {
    name: string;
    slug: string;
    subject: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  subtopicPerformance: {
    id: string;
    name: string;
    slug: string;
    topicName: string;
    topicSlug: string;
    subject: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  recentSessions: {
    id: string;
    subtopicName: string;
    score: number;
    totalQuestions: number;
    timeElapsedSeconds: number;
    date: string;
  }[];
  overallStats: {
    totalQuestions: number;
    accuracy: number;
    totalTimeSeconds: number;
    sessionCount: number;
    avgScore: number;
  };
  sectionScores: {
    readingWriting: {
      subject: string;
      total: number;
      correct: number;
      accuracy: number;
      scaledScore: number;
    };
    math: {
      subject: string;
      total: number;
      correct: number;
      accuracy: number;
      scaledScore: number;
    };
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

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const FILTERS: { value: FilterRange; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All" },
];

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function rangeStart(range: FilterRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "week") {
    start.setDate(now.getDate() - 6);
  } else {
    start.setDate(now.getDate() - 29);
  }
  return start;
}

function inRange(date: string, range: FilterRange): boolean {
  const start = rangeStart(range);
  if (!start) return true;
  return new Date(date) >= start;
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

function MetricCard({
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
      <p className="mt-5 text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function SectionRow({
  label,
  total,
  correct,
  accuracy,
}: {
  label: string;
  total: number;
  correct: number;
  accuracy: number;
}) {
  return (
    <div className="space-y-3 border-b border-border/60 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `${correct}/${total} questions` : "No completed questions yet"}
          </p>
        </div>
        <p className="text-2xl font-bold tabular-nums">{accuracy}%</p>
      </div>
      <div className="h-2 overflow-hidden bg-muted">
        <div className="h-full bg-primary" style={{ width: `${Math.min(accuracy, 100)}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-sm text-muted-foreground">{children}</p>;
}

export default function ProgressPage() {
  const [range, setRange] = useState<FilterRange>("month");

  const {
    data,
    isLoading: loading,
    isError,
  } = useQuery<ProgressData>({
    queryKey: ["progress"],
    queryFn: () =>
      fetch("/api/progress").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load progress data");
  }, [isError]);

  const filteredSessions = useMemo(
    () => data?.recentSessions.filter((session) => inRange(session.date, range)) ?? [],
    [data?.recentSessions, range]
  );

  const filteredScoreHistory = useMemo(
    () => data?.scoreHistory.filter((point) => inRange(point.date, range)) ?? [],
    [data?.scoreHistory, range]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="h-16 w-72 animate-pulse bg-muted" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="h-80 animate-pulse bg-muted lg:col-span-3" />
          <div className="h-80 animate-pulse bg-muted lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const averageAccuracy =
    (data.sectionScores.readingWriting.accuracy + data.sectionScores.math.accuracy) / 2;
  const currentScore = Math.round(120 + (averageAccuracy / 100) * 60);
  const rawTargetScore = data.user.targetScore ?? data.targetScore;
  const targetScore =
    rawTargetScore != null && rawTargetScore >= 120 && rawTargetScore <= 180
      ? rawTargetScore
      : 170;
  const scoreGap = Math.max(targetScore - currentScore, 0);
  const logicalReasoning = data.sectionScores.math;
  const readingComprehension = data.sectionScores.readingWriting;
  const weakestAreas = data.subtopicPerformance.slice(0, 4);
  const chartData =
    filteredScoreHistory.length > 0
      ? filteredScoreHistory.map((point) => ({
          label: formatShortDate(point.date),
          score: point.score,
          logicalReasoning: logicalReasoning.accuracy,
          readingComprehension: readingComprehension.accuracy,
        }))
      : data.scoreHistory.map((point) => ({
          label: formatShortDate(point.date),
          score: point.score,
          logicalReasoning: logicalReasoning.accuracy,
          readingComprehension: readingComprehension.accuracy,
        }));

  return (
    <div className="p-4 pb-16 md:p-6">
      <motion.div
        className="mx-auto max-w-6xl"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={staggerItem}
          className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              LSAT Progress
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Performance Overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Track score movement, section accuracy, and the review areas most likely to improve your next practice set.
            </p>
          </div>
          <div className="inline-flex h-10 shrink-0 items-center gap-1 border border-border/70 bg-card/80 p-1">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setRange(filter.value)}
                className={[
                  "inline-flex h-8 min-w-0 items-center justify-center whitespace-nowrap px-3 text-xs font-medium transition md:px-4",
                  range === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            label="Estimated Score"
            value={currentScore}
            detail={`${scoreBand(currentScore)} · ${estimatePercentile(currentScore)} percentile`}
            icon={TrendingUp}
          />
          <MetricCard
            label="Target Gap"
            value={scoreGap === 0 ? "Closed" : `${scoreGap} pts`}
            detail={`Target score ${targetScore}`}
            icon={Target}
          />
          <MetricCard
            label="Overall Accuracy"
            value={`${data.overallStats.accuracy}%`}
            detail={`${data.overallStats.totalQuestions} questions attempted`}
            icon={BarChart3}
          />
          <MetricCard
            label="Practice Time"
            value={formatTime(data.overallStats.totalTimeSeconds)}
            detail={`${data.overallStats.sessionCount} completed sets`}
            icon={Clock}
          />
        </motion.div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <motion.div
            variants={staggerItem}
            className="border border-border/70 bg-card/80 p-5 lg:col-span-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Score and Section Trend
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Historical LSAT estimate with current Logical Reasoning and Reading Comprehension accuracy context.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {range === "week" ? "Last 7 days" : range === "month" ? "Last 30 days" : "All activity"}
              </p>
            </div>
            <div className="mt-6 h-72">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="score"
                      domain={[120, 180]}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <YAxis
                      yAxisId="accuracy"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      yAxisId="score"
                      type="monotone"
                      dataKey="score"
                      name="Estimated score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="accuracy"
                      type="monotone"
                      dataKey="logicalReasoning"
                      name="Logical Reasoning accuracy"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="accuracy"
                      type="monotone"
                      dataKey="readingComprehension"
                      name="Reading Comprehension accuracy"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState>Complete practice sets to build your score trend.</EmptyState>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="border border-border/70 bg-card/80 p-5 lg:col-span-2"
          >
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Section Performance
            </h2>
            <div className="mt-3">
              <SectionRow
                label="Logical Reasoning"
                total={logicalReasoning.total}
                correct={logicalReasoning.correct}
                accuracy={logicalReasoning.accuracy}
              />
              <SectionRow
                label="Reading Comprehension"
                total={readingComprehension.total}
                correct={readingComprehension.correct}
                accuracy={readingComprehension.accuracy}
              />
            </div>
          </motion.div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <motion.div
            variants={staggerItem}
            className="border border-border/70 bg-card/80 p-5 lg:col-span-3"
          >
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Review Priorities
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lowest-performing LSAT areas based on completed practice.
            </p>
            <div className="mt-5 space-y-4">
              {weakestAreas.length > 0 ? (
                weakestAreas.map((area) => (
                  <div key={area.id} className="border border-border/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{area.name}</p>
                        <p className="text-sm text-muted-foreground">{area.topicName}</p>
                      </div>
                      <p className="text-xl font-bold tabular-nums">{area.accuracy}%</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(area.accuracy, 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {area.correct}/{area.total} correct
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState>Practice data will surface weak areas here.</EmptyState>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="border border-border/70 bg-card/80 p-5 lg:col-span-2"
          >
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Practice History
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Completed practice sets in the selected range.
            </p>
            <div className="mt-5 space-y-4">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => {
                  const accuracy = session.totalQuestions
                    ? Math.round((session.score / session.totalQuestions) * 100)
                    : 0;

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-4 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{session.subtopicName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatShortDate(session.date)} · {formatTime(session.timeElapsedSeconds)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums">
                          {session.score}/{session.totalQuestions}
                        </p>
                        <p className="text-xs text-muted-foreground">{accuracy}%</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState>No practice sets in this range.</EmptyState>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
