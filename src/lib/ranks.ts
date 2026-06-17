import { Shield, Sword, Swords, Crown, Flame, Star, Zap, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Rank = {
  name: string;
  threshold: number;
  weapon: string;
  icon: LucideIcon;
  emoji: string;
};

export const RANKS: Rank[] = [
  { name: "Novice", threshold: 120, weapon: "Rock of Knowledge", icon: Sword, emoji: "🪨" },
  { name: "Scout", threshold: 130, weapon: "Scouting Dagger", icon: Sword, emoji: "🗡" },
  { name: "Warrior", threshold: 140, weapon: "Blade of Persistence", icon: Swords, emoji: "⚔" },
  { name: "Knight", threshold: 150, weapon: "Shield of Focus", icon: Shield, emoji: "🛡" },
  { name: "Champion", threshold: 155, weapon: "Bow of Precision", icon: Flame, emoji: "🏹" },
  { name: "Master", threshold: 160, weapon: "Staff of Wisdom", icon: Star, emoji: "🔮" },
  { name: "Legend", threshold: 165, weapon: "Crown of Glory", icon: Crown, emoji: "👑" },
  { name: "Dragon Slayer", threshold: 170, weapon: "Dragon's Bane", icon: Zap, emoji: "🐉" },
  { name: "Ascended", threshold: 180, weapon: "Celestial Glory", icon: Sparkles, emoji: "✨" },
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
