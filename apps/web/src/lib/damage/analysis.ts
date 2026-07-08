import type { DamageOutput } from "./types";

/** Human-relevant summary of a damage roll set against a defender's HP. */
export type DamageAnalysis = {
  min: number;
  max: number;
  /** Percentage of the defender's max HP (rounded to one decimal). */
  minPercent: number;
  maxPercent: number;
  /** Fewest hits that can KO (using the maximum roll). */
  minHitsToKO: number;
  /** Most hits needed to KO (using the minimum roll). */
  maxHitsToKO: number;
  /** True when every roll KOs in `minHitsToKO` hits. */
  guaranteed: boolean;
  /** Probability (0–1) that a single hit KOs, over the 16 equally-likely rolls. */
  ohkoChance: number;
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Derive percentages and KO information from raw rolls. Pure — no wasm.
 *
 * `hitsToKO` uses the simple ceiling model (each hit deals the same roll). It
 * does not model per-hit roll variance across multi-hit sequences, which is a
 * reasonable approximation for the common "N-hit KO" display.
 */
export function analyze(output: DamageOutput, maxHp: number): DamageAnalysis {
  const { min, max, rolls } = output;
  const safeHp = Math.max(1, maxHp);

  const minHitsToKO = max > 0 ? Math.ceil(safeHp / max) : Infinity;
  const maxHitsToKO = min > 0 ? Math.ceil(safeHp / min) : Infinity;
  const ohkoCount = rolls.filter((r) => r >= safeHp).length;

  return {
    min,
    max,
    minPercent: round1((min / safeHp) * 100),
    maxPercent: round1((max / safeHp) * 100),
    minHitsToKO,
    maxHitsToKO,
    guaranteed: minHitsToKO === maxHitsToKO,
    ohkoChance: ohkoCount / rolls.length,
  };
}
