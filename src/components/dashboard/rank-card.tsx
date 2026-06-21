"use client";

import { motion } from "framer-motion";
import { ArrowRight, Diamond } from "lucide-react";
import Link from "next/link";
import { getRankProgress, RANKS } from "@/lib/ranks";
import { cn } from "@/lib/utils";

export function RankCard({
  totalScore,
  weeklyDelta,
}: {
  totalScore: number;
  weeklyDelta: number;
}) {
  const displayScore = Math.max(totalScore, 120);
  const { current, next, pct, pointsToNext } = getRankProgress(displayScore);
  const CurrentIcon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border bg-card p-6"
    >
      {/* Top row: rank info + VIEW STORY */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
            <CurrentIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              {current.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Focus: <span>{current.weapon}</span>
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          View Profile <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Score + weekly delta */}
      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-5xl font-bold tracking-tight tabular-nums">
          {displayScore}
        </span>
        {weeklyDelta > 0 && (
          <span className="text-sm font-medium text-muted-foreground">
            <Diamond className="mr-0.5 inline h-3 w-3" />
            +{weeklyDelta} this week
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
          <span className="text-foreground">
            {current.name}
          </span>
          {next && (
            <>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {next.name}
              </span>
            </>
          )}
        </div>
        <div className="h-2.5 w-full overflow-hidden bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          />
        </div>
        {next ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {pointsToNext} points to {next.name} &mdash; {next.weapon}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Maximum LSAT tier achieved
          </p>
        )}
      </div>

      {/* Tier icons row */}
      <div className="mt-5 flex items-center gap-3 border-t pt-4">
        {RANKS.map((rank) => {
          const unlocked = displayScore >= rank.threshold;
          const Icon = rank.icon;
          return (
            <div
              key={rank.name}
              className={cn(
                "flex h-8 w-8 items-center justify-center transition-opacity",
                unlocked
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground/30"
              )}
              title={`${rank.name} — ${rank.weapon}${unlocked ? " (Unlocked)" : ""}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
