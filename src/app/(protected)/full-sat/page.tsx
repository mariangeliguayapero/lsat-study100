"use client";

import { useRouter } from "next/navigation";
import { useFullSatStatus, useStartFullSat, useFullSatHistory } from "@/hooks/use-full-sat";
import { legacyCompositeToLsatScore } from "@/lib/lsat-score";
import { motion } from "framer-motion";
import { Clock, FileText, Lock, ArrowRight, ChevronLeft } from "lucide-react";

function formatDaysUntil(dateString: string): string {
  const diff = new Date(dateString).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Available now";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default function FullSatLandingPage() {
  const router = useRouter();
  const { data: status, isLoading } = useFullSatStatus();
  const { data: history } = useFullSatHistory();
  const startMutation = useStartFullSat();

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const handleStart = async (testId: string) => {
    const result = await startMutation.mutateAsync({ testId });
    router.push(`/full-sat/${result.attemptId}`);
  };

  const handleResume = () => {
    if (status.currentAttempt) {
      router.push(`/full-sat/${status.currentAttempt.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="lsat-panel lsat-panel-highlight mb-8 p-6 md:p-7"
      >
        <h1 className="text-2xl font-bold tracking-tight">Full LSAT Practice Test</h1>
        <p className="mt-2 text-muted-foreground">
          Take a timed LSAT-style practice test across Logical Reasoning and Reading Comprehension.
          Scores are shown on the LSAT 120-180 scale.
        </p>
      </motion.div>

      {/* Cooldown notice */}
      {!status.canTakeTest && status.nextAvailableDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lsat-panel mb-6 flex items-center gap-3 border-accent/40 bg-accent/10 px-4 py-3"
        >
          <Lock className="h-5 w-5 shrink-0 text-[var(--chart-2)]" />
          <div>
            <p className="text-sm font-medium">Cooldown Active</p>
            <p className="text-xs text-muted-foreground">
              Next test available in {formatDaysUntil(status.nextAvailableDate)}
            </p>
          </div>
        </motion.div>
      )}

      {/* Resume in-progress */}
      {status.currentAttempt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <button
            onClick={handleResume}
            className="lsat-panel lsat-interactive w-full border-2 border-primary bg-primary/5 px-6 py-4 text-left hover:bg-primary/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Resume In-Progress Test</p>
                <p className="text-sm text-muted-foreground">
                  Started {new Date(status.currentAttempt.startedAt).toLocaleDateString()}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </button>
        </motion.div>
      )}

      {/* Available tests */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Available Tests
        </h2>
        {status.tests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No tests available yet. Tests will appear here once the problem bank is seeded.
          </p>
        ) : (
          status.tests.map((test) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="lsat-panel p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">{test.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Timed sections
                    </span>
                    <span>Timed LSAT-style set</span>
                    <span>Logical Reasoning + Reading Comprehension</span>
                  </div>
                </div>
                <button
                  onClick={() => handleStart(test.id)}
                  disabled={!status.canTakeTest || !!status.currentAttempt || startMutation.isPending}
                  className="lsat-cta-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {startMutation.isPending ? "Starting..." : "Start"}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Past attempts */}
      {history?.attempts && history.attempts.length > 0 && (
        <div className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Past Attempts
          </h2>
          {history.attempts
            .filter((a) => a.status === "completed")
            .map((attempt) => (
              <button
                key={attempt.id}
                type="button"
                onClick={() => {
                  if (attempt.id) router.push(`/full-sat/${attempt.id}/results`);
                }}
                disabled={!attempt.id}
                aria-label={attempt.id ? "View LSAT practice score report" : "Score report unavailable"}
                className="lsat-panel lsat-interactive flex w-full flex-col gap-3 p-4 text-left hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(attempt.completedAt!).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>LSAT: {legacyCompositeToLsatScore(attempt.totalScore)}</span>
                    <span>LR/RC sections</span>
                    <span>
                      Time: {Math.round(attempt.totalTimeSeconds / 60)}m
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold tabular-nums">
                    {legacyCompositeToLsatScore(attempt.totalScore)}
                  </span>
                  <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:inline">
                    {attempt.id ? "View report" : "Report unavailable"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
