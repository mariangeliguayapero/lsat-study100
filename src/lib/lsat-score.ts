export function legacyCompositeToLsatScore(score: number | null | undefined): number {
  const value = score ?? 0;
  if (value >= 120 && value <= 180) return Math.round(value);

  const legacyMin = 400;
  const legacyMax = 1600;
  const normalized = Math.max(0, Math.min(1, (value - legacyMin) / (legacyMax - legacyMin)));
  return Math.round(120 + normalized * 60);
}

export function percentCorrect(correct: number | null | undefined, total: number): number {
  if (!total) return 0;
  return Math.round(((correct ?? 0) / total) * 100);
}
