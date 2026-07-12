"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Coffee, ArrowRight, Clock } from "lucide-react";
import { useFullSatContext } from "@/components/full-sat/full-sat-context";

function getSectionLabel(section: string) {
  return section === "reading_writing" ? "Reading Comprehension" : "Logical Reasoning";
}

export default function FullSatBreakPage() {
  const router = useRouter();
  const params = useParams<{ attemptId: string }>();
  const ctx = useFullSatContext();
  const [breakTime, setBreakTime] = useState(0); // seconds spent on break

  const completedSection = ctx.currentProblem?.section ?? ctx.problems[0]?.section;
  const nextSectionIndex = ctx.problems.findIndex(
    (problem) => problem.section !== completedSection
  );
  const nextProblem = nextSectionIndex >= 0 ? ctx.problems[nextSectionIndex] : null;
  const completedSectionLabel = completedSection
    ? getSectionLabel(completedSection)
    : "the current section";
  const nextSectionLabel = nextProblem ? getSectionLabel(nextProblem.section) : "Next Section";
  const nextSectionCount = nextProblem
    ? ctx.problems.filter((problem) => problem.section === nextProblem.section).length
    : 0;

  useEffect(() => {
    const timer = setInterval(() => setBreakTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleContinue = () => {
    if (nextSectionIndex >= 0) {
      ctx.resumeAfterBreak(nextSectionIndex);
      router.push(`/full-sat/${params.attemptId}/${nextSectionIndex + 1}`);
    } else {
      ctx.submitTest();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-md px-6 text-center"
      >
        <div className="mb-6 flex items-center justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Coffee className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">Section Break</h1>
        <p className="mt-2 text-muted-foreground">
          You&apos;ve completed {completedSectionLabel}.
          Take a moment to rest before starting {nextSectionLabel}.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Break time: {formatTime(breakTime)}</span>
        </div>

        <div className="mt-4 rounded-lg border bg-card p-4">
          <p className="text-sm font-medium">Up Next</p>
          <p className="text-xs text-muted-foreground mt-1">
            {nextSectionLabel}: {nextSectionCount} questions
          </p>
        </div>

        <button
          onClick={handleContinue}
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue to {nextSectionLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
}
