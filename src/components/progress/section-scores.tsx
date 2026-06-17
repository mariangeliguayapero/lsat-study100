"use client";

import { motion } from "framer-motion";

type SectionData = {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
  scaledScore: number;
};

export function SectionScores({
  rw,
  math,
}: {
  rw: SectionData;
  math: SectionData;
  targetScore: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
        <SectionCard
          label="Reading Comprehension"
          score={rw.accuracy}
        />
        <SectionCard
          label="Logical Reasoning"
          score={math.accuracy}
        />
    </div>
  );
}

function SectionCard({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const pct = Math.min(score, 100);

  return (
    <div className="border bg-card p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tabular-nums">{score}</span>
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Accuracy by section
      </p>
    </div>
  );
}
