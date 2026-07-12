"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, LoaderCircle, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

type LearningWorkspaceStateProps = {
  variant?: "loading" | "empty";
  title?: string;
  description?: string;
  className?: string;
};

export function LearningWorkspaceState({
  variant = "empty",
  title = "Lesson workspace ready",
  description = "Guided notes and visual explanations will appear here as the lesson continues.",
  className,
}: LearningWorkspaceStateProps) {
  const isLoading = variant === "loading";
  const Icon = isLoading ? LoaderCircle : BookOpenCheck;

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[320px] w-full items-center justify-center overflow-hidden border border-border/70 bg-card/70 p-6",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/80 to-background" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md border border-border/80 bg-card/95 p-6 text-center shadow-sm"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center border border-primary/25 bg-primary/10 text-primary">
          <Icon className={cn("h-5 w-5", isLoading && "animate-spin")} />
        </div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          {isLoading ? "Preparing workspace" : "Guided workspace"}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-5 space-y-2" aria-hidden="true">
          {[82, 100, 68].map((width, index) => (
            <motion.div
              key={width}
              className="mx-auto h-1.5 bg-primary/15"
              style={{ width: `${width}%` }}
              animate={isLoading ? { opacity: [0.35, 0.8, 0.35] } : undefined}
              transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.16 }}
            />
          ))}
        </div>
        {!isLoading && (
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <PenLine className="h-3.5 w-3.5 text-[var(--chart-2)]" />
            Continue the lesson or ask Athena for guidance
          </div>
        )}
      </motion.div>
    </div>
  );
}
