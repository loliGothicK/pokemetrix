import type { MoveCategory, Type } from "@/types/pokemon";

/**
 * Every damage modifier is stored by the game as `x / 4096`. `NEUTRAL` (4096)
 * is a no-op (1.0x) multiplier.
 *
 * These mirror the values documented in DaWoblefet's damage dissertation. The
 * Rust engine only knows how to *apply* and *chain* these values with the
 * correct rounding; deciding *which* apply is this layer's job.
 */
export const M = {
  NEUTRAL: 4096,
  // General damage modifiers
  SPREAD: 3072, // 0.75x — spread move hitting multiple targets
  SPREAD_ROYAL: 2048, // 0.5x — Battle Royal spread
  PARENTAL_BOND_SECOND_HIT: 1024, // 0.25x
  WEATHER_BOOST: 6144, // 1.5x — e.g. Rain on Water
  WEATHER_PENALTY: 2048, // 0.5x — e.g. Rain on Fire
  CRIT: 6144, // 1.5x
  STAB: 6144, // 1.5x
  STAB_ADAPTABILITY: 8192, // 2.0x
  BURN: 2048, // 0.5x
  Z_INTO_PROTECT: 1024, // 0.25x
  // Final modifiers
  SCREEN_SINGLES: 2048, // 0.5x
  SCREEN_DOUBLES: 2732, // 0.6669921875x
  LIFE_ORB: 5324, // ~1.3x
  FRIEND_GUARD: 3072, // 0.75x
  MULTISCALE: 2048, // 0.5x — defender at full HP
  TINTED_LENS: 8192, // 2x — resisted move
  EXPERT_BELT: 4915, // ~1.2x — super effective
  NEUROFORCE: 5120, // 1.25x — super effective
  FILTER_SOLID_ROCK: 3072, // 0.75x — super effective
  // Attack modifiers
  CHOICE: 6144, // 1.5x — Choice Band / Specs
  HUGE_POWER: 8192, // 2x
  // Base-power modifiers
  TYPE_ITEM: 4915, // ~1.2x — Plate / type gem-ish items
  TERRAIN_OFFENSIVE: 6144, // 1.5x — matching terrain
  HELPING_HAND: 6144, // 1.5x
} as const;

/** Input to the WASM damage engine (mirrors the Rust `DamageInput`). */
export type DamageInput = {
  level: number;
  basePower: number;
  bpModifiers?: number[];
  attack: number;
  attackBoost?: number; // -6..6
  attackModifiers?: number[];
  defense: number;
  defenseBoost?: number; // -6..6
  defenseModifiers?: number[];
  isPhysical: boolean;
  moveType: Type;
  defenderType1: Type;
  defenderType2?: Type | null;
  effectivenessOverride?: number | null;
  immuneOverride?: boolean | null;
  spreadModifier?: number;
  parentalBondModifier?: number;
  weatherModifier?: number;
  isCrit?: boolean;
  critModifier?: number;
  stabModifier?: number;
  isBurned?: boolean;
  finalModifiers?: number[];
  protectModifier?: number;
};

/** Output from the WASM damage engine (mirrors the Rust `DamageOutput`). */
export type DamageOutput = {
  /** All 16 possible damage rolls, ascending (index 0 = min, 15 = max). */
  rolls: number[];
  min: number;
  max: number;
};

/** Whether a move category uses the physical Attack stat. */
export const isPhysicalCategory = (category: MoveCategory): boolean => category === "physical";
