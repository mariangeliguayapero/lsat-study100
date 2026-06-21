import {
  Award,
  BadgeCheck,
  Brain,
  Circle,
  Flame,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Rank = {
  name: string;
  threshold: number;
  weapon: string;
  icon: LucideIcon;
  emoji: string;
};

export const RANKS: Rank[] = [
  { name: "Baseline", threshold: 120, weapon: "Diagnostic foundation", icon: Circle, emoji: "I" },
  { name: "Foundation", threshold: 130, weapon: "Core accuracy", icon: Target, emoji: "II" },
  { name: "Developing", threshold: 140, weapon: "Reasoning control", icon: Brain, emoji: "III" },
  { name: "Proficient", threshold: 150, weapon: "Timed precision", icon: ShieldCheck, emoji: "IV" },
  { name: "Advanced", threshold: 155, weapon: "Argument mastery", icon: BadgeCheck, emoji: "V" },
  { name: "High Scorer", threshold: 160, weapon: "Section consistency", icon: Award, emoji: "VI" },
  { name: "Elite", threshold: 165, weapon: "Top-tier pacing", icon: Flame, emoji: "VII" },
  { name: "170+", threshold: 170, weapon: "Law-school ready", icon: Scale, emoji: "VIII" },
  { name: "Perfect", threshold: 180, weapon: "180 mastery", icon: Sparkles, emoji: "IX" },
];

export function getRank(score: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].threshold) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(score: number): Rank | null {
  const current = getRank(score);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function getRankProgress(score: number) {
  const current = getRank(score);
  const next = getNextRank(score);

  if (!next) {
    return { current, next: null, pct: 100, pointsToNext: 0 };
  }

  const range = next.threshold - current.threshold;
  const progress = score - current.threshold;
  const pct = Math.min(Math.max(Math.round((progress / range) * 100), 0), 100);

  return {
    current,
    next,
    pct,
    pointsToNext: next.threshold - score,
  };
}
