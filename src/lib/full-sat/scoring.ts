/**
 * Legacy full-test raw-to-scaled conversion.
 *
 * The app still stores full practice section scores in the original SAT-shaped
 * columns, then converts the composite to the visible LSAT 120-180 estimate.
 * Totals are configurable so demo LSAT sets can use the actual seeded question
 * counts instead of the old 54/44 section sizes.
 */

/**
 * Scale a Reading/Reading Comprehension raw score to 200-800.
 */
export function scaleRwScore(rawCorrect: number, totalQuestions = 54): number {
  const ratio = totalQuestions > 0
    ? Math.max(0, Math.min(1, rawCorrect / totalQuestions))
    : 0;

  // Piecewise linear approximation used only as an internal bridge to LSAT scale.
  if (ratio >= 0.96) return 800;
  if (ratio >= 0.89) return 750 + Math.round(((ratio - 0.89) / 0.07) * 50);
  if (ratio >= 0.78) return 650 + Math.round(((ratio - 0.78) / 0.11) * 100);
  if (ratio >= 0.63) return 530 + Math.round(((ratio - 0.63) / 0.15) * 120);
  if (ratio >= 0.44) return 400 + Math.round(((ratio - 0.44) / 0.19) * 130);
  if (ratio >= 0.26) return 300 + Math.round(((ratio - 0.26) / 0.18) * 100);
  if (ratio >= 0.11) return 230 + Math.round(((ratio - 0.11) / 0.15) * 70);
  return 200 + Math.round((ratio / 0.11) * 30);
}

/**
 * Scale a Math/Logical Reasoning raw score to 200-800.
 */
export function scaleMathScore(rawCorrect: number, totalQuestions = 44): number {
  const ratio = totalQuestions > 0
    ? Math.max(0, Math.min(1, rawCorrect / totalQuestions))
    : 0;

  // Piecewise linear approximation used only as an internal bridge to LSAT scale.
  if (ratio >= 0.98) return 800;
  if (ratio >= 0.91) return 750 + Math.round(((ratio - 0.91) / 0.07) * 50);
  if (ratio >= 0.80) return 650 + Math.round(((ratio - 0.80) / 0.11) * 100);
  if (ratio >= 0.64) return 530 + Math.round(((ratio - 0.64) / 0.16) * 120);
  if (ratio >= 0.45) return 400 + Math.round(((ratio - 0.45) / 0.19) * 130);
  if (ratio >= 0.27) return 300 + Math.round(((ratio - 0.27) / 0.18) * 100);
  if (ratio >= 0.11) return 230 + Math.round(((ratio - 0.11) / 0.16) * 70);
  return 200 + Math.round((ratio / 0.11) * 30);
}

/**
 * Compute the legacy composite score from raw correct counts.
 */
export function computeFullSatScore(
  rwRaw: number,
  mathRaw: number,
  rwTotalQuestions = 54,
  mathTotalQuestions = 44
) {
  const rwScaled = scaleRwScore(rwRaw, rwTotalQuestions);
  const mathScaled = scaleMathScore(mathRaw, mathTotalQuestions);
  return {
    rwScaled,
    mathScaled,
    total: rwScaled + mathScaled,
  };
}
