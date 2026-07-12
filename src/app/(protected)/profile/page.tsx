"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Settings } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AnimatedSprite } from "@/components/pixel-art/animated-sprite";
import { ProfileNameEditor } from "@/components/profile/profile-name-editor";
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  const { user } = data;
  const targetScore =
    user.targetScore != null && user.targetScore >= 120 && user.targetScore <= 180
      ? user.targetScore
      : 170;

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
              className="lsat-panel lsat-panel-highlight p-5"
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
                      LSAT study preferences and account setup
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="lsat-panel p-5"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Study Setup
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Preferences used to tailor practice recommendations and pacing.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="lsat-panel-soft border p-4">
                  <p className="text-sm font-semibold">Target outcome</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Target score {targetScore}
                  </p>
                </div>
                <div className="lsat-panel-soft border p-4">
                  <p className="text-sm font-semibold">Recommended session length</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    30-45 minutes for focused LR/RC review
                  </p>
                </div>
                <div className="lsat-panel-soft border p-4">
                  <p className="text-sm font-semibold">Weekly availability</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.weeklyStreakDays.filter((day) => day.completed).length} recent study days logged
                  </p>
                </div>
                <div className="lsat-panel-soft border p-4">
                  <p className="text-sm font-semibold">Exam timeline</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a test date later to personalize pacing
                  </p>
                </div>
              </div>
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
              className="lsat-panel p-5"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Account & Preferences
                </h3>
              </div>
              <dl className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">Display name</dt>
                  <dd className="max-w-36 truncate text-sm font-medium">{user.displayName ?? "Student"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">Prep started</dt>
                  <dd className="text-sm font-medium">{formatDate(user.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">Target score</dt>
                  <dd className="text-sm font-medium">{targetScore}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">Notifications</dt>
                  <dd className="text-sm font-medium">Not configured</dd>
                </div>
              </dl>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
