import type { Type } from "@/types/pokemon";

/**
 * Type-effectiveness chart, ported from the Rust engine's `single_matchup`
 * (packages/damage-calc/src/calc.rs). The Rust chart remains the source of
 * truth for the normal calculation; this TS copy exists only so the modifier
 * resolution layer can compute *effectiveness overrides* (Freeze-Dry, Tar Shot)
 * synchronously without a round-trip to WASM.
 *
 * Keep this in sync with the Rust chart if the latter ever changes.
 */

type Matchups = {
  /** Super-effective (×2) defender types. */
  readonly se?: readonly Type[];
  /** Not-very-effective (×0.5) defender types. */
  readonly nve?: readonly Type[];
  /** Immune (×0) defender types. */
  readonly immune?: readonly Type[];
};

const CHART: Partial<Record<Type, Matchups>> = {
  fire: { se: ["grass", "ice", "bug", "steel"], nve: ["fire", "water", "rock", "dragon"] },
  water: { se: ["fire", "ground", "rock"], nve: ["water", "grass", "dragon"] },
  electric: { se: ["water", "flying"], nve: ["electric", "grass", "dragon"], immune: ["ground"] },
  grass: {
    se: ["water", "ground", "rock"],
    nve: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
  },
  ice: { se: ["grass", "ground", "flying", "dragon"], nve: ["fire", "water", "ice", "steel"] },
  fighting: {
    se: ["normal", "ice", "rock", "dark", "steel"],
    nve: ["poison", "flying", "psychic", "bug", "fairy"],
    immune: ["ghost"],
  },
  poison: { se: ["grass", "fairy"], nve: ["poison", "ground", "rock", "ghost"], immune: ["steel"] },
  ground: {
    se: ["fire", "electric", "poison", "rock", "steel"],
    nve: ["grass", "bug"],
    immune: ["flying"],
  },
  flying: { se: ["grass", "fighting", "bug"], nve: ["electric", "rock", "steel"] },
  psychic: { se: ["fighting", "poison"], nve: ["psychic", "steel"], immune: ["dark"] },
  bug: {
    se: ["grass", "psychic", "dark"],
    nve: ["fire", "fighting", "flying", "ghost", "steel", "fairy"],
  },
  rock: { se: ["fire", "ice", "flying", "bug"], nve: ["fighting", "ground", "steel"] },
  ghost: { se: ["psychic", "ghost"], nve: ["dark"], immune: ["normal"] },
  dragon: { se: ["dragon"], nve: ["steel"], immune: ["fairy"] },
  dark: { se: ["psychic", "ghost"], nve: ["fighting", "dark", "fairy"] },
  steel: { se: ["ice", "rock", "fairy"], nve: ["fire", "water", "electric", "steel"] },
  fairy: { se: ["fighting", "dragon", "dark"], nve: ["fire", "poison", "steel"] },
  normal: { nve: ["rock", "steel"], immune: ["ghost"] },
};

/** Single-matchup multiplier ×100 (200 / 100 / 50 / 0). */
function singleMatchup(att: Type, def: Type): number {
  const m = CHART[att];
  if (!m) return 100;
  if (m.immune?.includes(def)) return 0;
  if (m.se?.includes(def)) return 200;
  if (m.nve?.includes(def)) return 50;
  return 100;
}

/** Shift for a single matchup: +1 (×2), 0 (×1), -1 (×0.5). Immune → null. */
function matchupShift(att: Type, def: Type): number | null {
  const m = singleMatchup(att, def);
  if (m === 0) return null;
  if (m === 200) return 1;
  if (m === 50) return -1;
  return 0;
}

/** Whether the move is completely ineffective against the defender. */
export function isImmune(att: Type, def1: Type, def2?: Type | null): boolean {
  return singleMatchup(att, def1) === 0 || (def2 != null && singleMatchup(att, def2) === 0);
}

/**
 * Combined effectiveness shift (immune components counted as 0 — callers must
 * check `isImmune` separately).
 */
export function effectivenessShift(att: Type, def1: Type, def2?: Type | null): number {
  const s1 = matchupShift(att, def1) ?? 0;
  const s2 = def2 != null ? (matchupShift(att, def2) ?? 0) : 0;
  return s1 + s2;
}

/**
 * Freeze-Dry: an Ice move that hits Water super-effectively (×2 on the Water
 * component) instead of Ice's usual ×0.5. Returns the combined shift.
 */
export function freezeDryOverride(def1: Type, def2?: Type | null): number {
  const shift = (t: Type): number => (t === "water" ? 1 : (matchupShift("ice", t) ?? 0));
  return shift(def1) + (def2 != null ? shift(def2) : 0);
}

/**
 * Tar Shot: the target gains an extra Fire weakness (one additional ×2 step).
 * Only meaningful for Fire moves; returns the overridden combined shift.
 */
export function tarShotFireOverride(def1: Type, def2?: Type | null): number {
  return effectivenessShift("fire", def1, def2) + 1;
}
