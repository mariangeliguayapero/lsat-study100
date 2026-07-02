"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Target, TrendingUp } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AnimatedSprite } from "@/components/pixel-art/animated-sprite";
import { ProfileNameEditor } from "@/components/profile/profile-name-editor";
import { SatScoreHistory } from "@/components/profile/sat-score-history";
import { ScheduleEditor } from "@/components/profile/schedule-editor";

type SatAttempt = {
  id: string;
  totalScore: number | null;
  rwScaledScore: number | null;
  mathScaledScore: number | null;
  completedAt: string | null;
};

type ConsistencyDay = {
  day: string;
  completed: boolean;
  isPast: boolean;
};

type ProfileData = {
  user: {
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string;
    targetScore: number | null;
  } | null;
  totalScore: number;
  questsDone: number;
  totalTimeSeconds: number;
  accuracy: number;
  latestSatAttempt: SatAttempt | null;
  weeklyStreakDays: ConsistencyDay[];
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  detail?: string;
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
      {detail && <p className="mt-2 text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

function PracticeConsistency({ days }: { days: ConsistencyDay[] }) {
  const completed = days.filter((day) => day.completed).length;

  return (
    <div className="border border-border/70 bg-card/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Practice Consistency
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {completed} of {days.length} scheduled days completed this week.
          </p>
        </div>
        <p className="text-2xl font-bold tabular-nums">{completed}/{days.length}</p>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div key={`${day.day}-${index}`} className="space-y-2">
            <div
              className={[
                "h-2.5 border",
                day.completed
                  ? "border-primary bg-primary"
                  : day.isPast
                    ? "border-border bg-muted"
                    : "border-dashed border-border bg-transparent",
              ].join(" ")}
            />
            <p className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
              {day.day}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: userData, loading: userLoading } = useCurrentUser();

  const readyToLoad =
    !userLoading && !!userData && userData.user.onboardingCompleted;

  const {
    data,
    isLoading: profileLoading,
    isError,
  } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: () =>
      fetch("/api/profile").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 2 * 60_000,
    enabled: readyToLoad,
  });

  useEffect(() => {
    if (!userLoading && userData && !userData.user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [userData, userLoading, router]);

  useEffect(() => {
    if (isError) toast.error("Failed to load profile data");
  }, [isError]);

  const loading = userLoading || profileLoading;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="h-8 w-48 animate-pulse bg-muted" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="h-28 animate-pulse bg-muted" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse bg-muted" />
              ))}
            </div>
            <div className="h-36 animate-pulse bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-36 animate-pulse bg-muted" />
            <div className="h-44 animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.user) return null;

  const { user, questsDone, totalTimeSeconds, accuracy } = data;
  const currentScore = Math.max(data.totalScore, 120);
  const targetScore =
    user.targetScore != null && user.targetScore >= 120 && user.targetScore <= 180
      ? user.targetScore
      : 170;
  const gap = Math.max(targetScore - currentScore, 0);
  const targetProgress = Math.min(
    Math.max(Math.round(((currentScore - 120) / (targetScore - 120)) * 100), 0),
    100
  );

  return (
    <div className="relative z-10 p-4 pb-16 md:p-6">
      <motion.div
        className="mx-auto max-w-6xl"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={staggerItem} className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
            LSAT Profile
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Study Profile</h1>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <motion.div
              variants={staggerItem}
              className="border border-border/70 bg-card/80 p-5"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <AnimatedSprite
                    src="/images/pixel-art/profile-avatar.png"
                    alt="Profile avatar"
                    width={64}
                    height={64}
                  />
                  <div className="min-w-0">
                    <ProfileNameEditor displayName={user.displayName} />
                    <p className="text-sm text-muted-foreground">
                      Prep started {formatDate(user.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {scoreBand(currentScore)} · Estimated {estimatePercentile(currentScore)} percentile
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Estimated LSAT
                  </p>
                  <p className="mt-1 text-5xl font-bold tabular-nums">{currentScore}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              <MetricCard
                label="Target Score"
                value={targetScore}
                detail={gap === 0 ? "Target reached" : `${gap} point gap`}
                icon={Target}
              />
              <MetricCard
                label="Overall Accuracy"
                value={`${accuracy}%`}
                detail={`${questsDone} completed practice sets`}
                icon={TrendingUp}
              />
              <MetricCard
                label="Study Time"
                value={formatTime(totalTimeSeconds)}
                detail="Tracked across practice work"
                icon={Clock}
              />
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="border border-border/70 bg-card/80 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Target Progress
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Estimated score movement toward the current LSAT goal.
                  </p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Currently <span className="text-foreground">{currentScore}</span>
                </p>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <p className="text-3xl font-bold tabular-nums">{targetScore}</p>
                <p className="text-sm text-muted-foreground">
                  {gap === 0 ? "At target" : `${gap} points remaining`}
                </p>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${targetProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <PracticeConsistency days={data.weeklyStreakDays} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <SatScoreHistory latestAttempt={data.latestSatAttempt} />
            </motion.div>
          </div>

          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={staggerItem}>
              <ScheduleEditor />
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="border border-border/70 bg-card/80 p-5"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Score Context
                </h3>
              </div>
              <dl className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">Score band</dt>
                  <dd className="text-sm font-medium">{scoreBand(currentScore)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">Estimated percentile</dt>
                  <dd className="text-sm font-medium">{estimatePercentile(currentScore)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">Score gap</dt>
                  <dd className="text-sm font-medium">{gap} points</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">Practice sets</dt>
                  <dd className="text-sm font-medium">{questsDone}</dd>
                </div>
              </dl>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
