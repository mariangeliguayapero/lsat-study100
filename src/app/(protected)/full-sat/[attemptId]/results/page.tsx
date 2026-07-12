"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, Target } from "lucide-react";
import type { FullSatHistoryResponse, FullSatSubmitResponse } from "@/types/full-sat";
import { legacyCompositeToLsatScore, percentCorrect } from "@/lib/lsat-score";

export default function FullSatResultsPage() {
  const router = useRouter();
  const params = useParams<{ attemptId: string }>();
  const [results, setResults] = useState<FullSatSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get results from the attempt history
    async function fetchResults() {
      try {
        const res = await fetch("/api/full-sat/history");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = (await res.json()) as FullSatHistoryResponse;
        const attempt = data.attempts?.find(
          (a) => a.id === params.attemptId
        );
        if (attempt && attempt.status === "completed") {
          setResults({
            rwRawScore: attempt.rwRawScore ?? 0,
            rwScaledScore: attempt.rwScaledScore ?? 0,
            rwTotalQuestions: attempt.rwTotalQuestions,
            mathRawScore: attempt.mathRawScore ?? 0,
            mathScaledScore: attempt.mathScaledScore ?? 0,
            mathTotalQuestions: attempt.mathTotalQuestions,
            totalScore: attempt.totalScore ?? 0,
          });
        }
      } catch {
        // Results may be passed via query state from submit
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [params.attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Results not available yet.</p>
        <button
          onClick={() => router.push("/full-sat")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to Full LSAT
        </button>
      </div>
    );
  }

  const lsatScore = legacyCompositeToLsatScore(results.totalScore);
  const readingTotal = results.rwTotalQuestions ?? 54;
  const reasoningTotal = results.mathTotalQuestions ?? 44;
  const readingAccuracy = percentCorrect(results.rwRawScore, readingTotal);
  const reasoningAccuracy = percentCorrect(results.mathRawScore, reasoningTotal);
  const targetScore = 170;
  const targetGap = Math.max(0, targetScore - lsatScore);
  const scoreBand =
    lsatScore >= 170
      ? "Target-ready"
      : lsatScore >= 160
        ? "Strong foundation"
        : lsatScore >= 150
          ? "Developing range"
          : "Starting score range";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-auto">
      <div className="mx-auto max-w-2xl px-4 py-12 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-4 flex items-center justify-center">
            <div className="lsat-panel-soft border-primary/25 bg-primary/10 p-4">
              <Target className="h-9 w-9 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            LSAT Practice Score Report
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estimated score, section performance, and next steps from this timed set.
          </p>
        </motion.div>

        {/* Total score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Estimated LSAT Score
          </p>
          <p className="mt-2 text-6xl font-bold tabular-nums text-primary">
            {lsatScore}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {scoreBand} · {targetGap === 0 ? "target reached" : `${targetGap} points from 170`}
          </p>
        </motion.div>

        {/* Section breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 grid gap-4 sm:grid-cols-2"
        >
          {/* Reading Comprehension */}
          <div className="lsat-panel p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
              <BookOpen className="h-4 w-4" />
              Reading Comprehension
            </div>
            <p className="text-3xl font-bold tabular-nums">
              {readingAccuracy}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {results.rwRawScore}/{readingTotal} correct
            </p>
            <div className="mt-3 h-2 overflow-hidden bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${readingAccuracy}%` }}
              />
            </div>
          </div>

          {/* Logical Reasoning */}
          <div className="lsat-panel p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
              <Brain className="h-4 w-4" />
              Logical Reasoning
            </div>
            <p className="text-3xl font-bold tabular-nums">
              {reasoningAccuracy}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {results.mathRawScore}/{reasoningTotal} correct
            </p>
            <div className="mt-3 h-2 overflow-hidden bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${reasoningAccuracy}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Score interpretation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="lsat-panel mt-8 p-5"
        >
          <h3 className="mb-2 text-sm font-semibold">Score Breakdown</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Reading Comprehension Accuracy</span>
              <span className="font-medium text-foreground">
                {results.rwRawScore} / {readingTotal} ({readingAccuracy}%)
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Logical Reasoning Accuracy</span>
              <span className="font-medium text-foreground">
                {results.mathRawScore} / {reasoningTotal} ({reasoningAccuracy}%)
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-foreground">
              <span>Estimated LSAT</span>
              <span>{lsatScore} / 180</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Target relation</span>
              <span className="font-medium text-foreground">
                {targetGap === 0 ? "At or above 170 target" : `${targetGap} points from 170 target`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <button
            onClick={() => router.push("/full-sat")}
            className="lsat-cta-secondary flex-1 border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to Full LSAT
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="lsat-cta-primary inline-flex flex-1 items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
