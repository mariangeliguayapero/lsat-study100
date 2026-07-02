"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ClipboardList, Target } from "lucide-react";
import { useTodaysQuest } from "@/hooks/use-daily-quest";

export function DailyQuestCard() {
  const { data, isLoading } = useTodaysQuest();

  if (isLoading) {
    return <div className="h-44 animate-pulse border bg-card" />;
  }

  const quest = data?.quest;

  // Quest unavailable until LSAT content/adaptive generation is ready.
  if (!quest) {
    return (
      <div className="border bg-card/80 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Daily Practice
            </p>
            <h2 className="mt-2 text-xl font-semibold">Adaptive set unavailable</h2>
          </div>
          <Target className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Adaptive practice will unlock after the LSAT question bank is ready.
        </p>
      </div>
    );
  }

  // Quest completed
  if (quest.status === "completed") {
    const accuracy = quest.totalQuestions > 0
      ? Math.round((quest.correctCount / quest.totalQuestions) * 100)
      : 0;

    return (
      <div className="border border-emerald-500/25 bg-card/85 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Daily Practice
            </p>
            <h2 className="mt-2 text-xl font-semibold">Practice set complete</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {quest.correctCount}/{quest.totalQuestions} correct ({accuracy}% accuracy)
            </p>
          </div>
          <p className="text-right text-sm font-semibold text-emerald-300">
            Logged
          </p>
        </div>
      </div>
    );
  }

  // Quest ready (pending) or in progress
  const answered = data?.problems?.filter(
    (p: { isCorrect: boolean | null }) => p.isCorrect !== null
  ).length ?? 0;
  const progress = Math.round((answered / quest.totalQuestions) * 100);

  return (
    <Link href="/quest">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="group cursor-pointer border bg-card/85 p-6 transition-colors hover:border-primary/50"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Adaptive Practice Set
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {answered > 0 ? "Continue today's set" : "Start today's set"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {answered > 0
                ? `${answered}/${quest.totalQuestions} answered, ${progress}% complete`
                : `${quest.totalQuestions} LSAT questions selected from your current profile`}
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </span>
        </div>
        {answered > 0 && (
          <div className="h-1.5 w-full overflow-hidden bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
          {answered > 0 ? "Resume practice" : "Begin practice"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </p>
      </motion.div>
    </Link>
  );
}
