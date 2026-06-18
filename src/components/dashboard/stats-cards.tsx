"use client";

export function StatsCards({
  targetScore,
  sessionsCount,
}: {
  targetScore: number | null;
  sessionsCount: number;
}) {
  const lsatTarget =
    targetScore != null && targetScore >= 120 && targetScore <= 180
      ? targetScore
      : 170;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="border bg-card p-4">
        <p className="text-2xl font-bold tabular-nums">
          {lsatTarget}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Target
        </p>
      </div>
      <div className="border bg-card p-4">
        <p className="text-2xl font-bold tabular-nums">{sessionsCount}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sessions
        </p>
      </div>
    </div>
  );
}
