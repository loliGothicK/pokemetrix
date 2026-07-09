import type { MoveCategory, Type } from "@/types/pokemon";
import type { Terrain } from "./modifiers";
import { M } from "./types";

/**
 * Move mechanics classification for the damage calculator UI.
 *
 * The damage engine (Rust/WASM) receives a *resolved* base power and *resolved*
 * attack/defense values. Everything about "which stat feeds the formula",
 * "how the base power varies with the battle state", and "which conditional
 * base-power modifiers apply" is decided here, in the TS layer, so the UI can:
 *   1. Show only the stats a move actually needs (progressive disclosure).
 *   2. Compute the effective base power from dynamic inputs (HP%, speed, weight).
 *   3. Offer conditional-power toggles (Hex, Facade, Round, Dragon Rush, ...).
 *
 * Two distinct hooks exist:
 *   - `computeBasePower(ctx)` SETS the raw base power for formula moves
 *     (Eruption, Gyro Ball, Low Kick, ...).
 *   - `bpModifiers(ctx)` returns extra `x/4096` base-power modifiers to chain
 *     (conditional doublers, Knock Off, Rising Voltage, ...), which is the
 *     game-accurate way to apply "×2 when ..." effects.
 */

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

/** A checkbox shown under the move that conditionally changes its power. */
export type MoveConditionDef = {
  readonly key: string; // stored in PokemonPanelState.moveConditions
  readonly labelKey: string; // i18n key
};

/** Context passed to variable-power / bp-modifier resolvers. */
export type PowerContext = {
  /** Static base power from move data (may be 0 / low for variable moves). */
  readonly basePower: number;
  /** Attacker current HP as a percentage (0–100). */
  readonly attackerHpPercent: number;
  /** Defender current HP as a percentage (0–100). */
  readonly defenderHpPercent: number;
  /** Attacker Speed actual value (after Tailwind / Paralysis). */
  readonly attackerSpe: number;
  /** Defender Speed actual value (after Tailwind / Paralysis). */
  readonly defenderSpe: number;
  /** Attacker weight in kilograms. */
  readonly attackerWeight: number;
  /** Defender weight in kilograms. */
  readonly defenderWeight: number;
  /** Active field terrain. */
  readonly terrain: Terrain;
  /** Whether the defender is holding a (removable) item — for Knock Off. */
  readonly defenderHasItem: boolean;
  /** Move-condition checkbox states (keyed by MoveConditionDef.key). */
  readonly conditions: Readonly<Record<string, boolean>>;
};

export type MoveMechanics = {
  /** Which stat the attacker uses offensively. Default: physical→atk, special→spa. */
  readonly offensiveStat: "atk" | "spa" | "def";
  /** Which defender stat the move checks. Default: physical→def, special→spd. */
  readonly defensiveStat: "def" | "spd";
  /** If true, damage uses the DEFENDER's Attack stat (Foul Play). */
  readonly useTargetAttack: boolean;
  /** Extra attacker stats the UI must surface (besides the offensive stat). */
  readonly attackerExtraStats: readonly StatKey[];
  /** Extra defender stats the UI must surface (besides HP + defensive stat). */
  readonly defenderExtraStats: readonly StatKey[];
  /** Whether the attacker's current HP% is needed. */
  readonly usesAttackerHp: boolean;
  /** Whether the move's power derives from Pokémon weight. */
  readonly usesWeight: boolean;
  /** Compute effective (raw) base power. undefined ⇒ use the static move power. */
  readonly computeBasePower?: (ctx: PowerContext) => number;
  /** Conditional base-power modifiers (`x/4096`) to chain. */
  readonly bpModifiers?: (ctx: PowerContext) => number[];
  /** Conditional-power toggles shown under the move. */
  readonly conditions: readonly MoveConditionDef[];
  /** Freeze-Dry: hits Water super-effectively. */
  readonly freezeDry?: boolean;
  /**
   * Multi-hit count. min === max means a fixed number of hits.
   * For moves that hit 2–5 times, min=2, max=5.
   * undefined (or {min:1,max:1}) means a single-hit move.
   *
   * Triple Axel is treated as fixed 3 hits with the engine receiving the
   * *sum* base-power (20+40+60 = 120) so the displayed damage is already
   * the full 3-hit total. Its hitCount is therefore {min:3,max:3} for the
   * UI label only — no multiplication is applied on top.
   */
  readonly hitCount?: { readonly min: number; readonly max: number };
  /**
   * When true, the engine's basePower already represents the full multi-hit
   * total (e.g. Triple Axel = 120). The UI shows "× N hits" as a label
   * without multiplying the raw roll numbers again.
   */
  readonly hitCountAlreadyMerged?: boolean;
};

// ---------------------------------------------------------------------------
// Base-power formulas (SET the raw base power)
// ---------------------------------------------------------------------------

/** Eruption / Water Spout: 150 × currentHP/maxHP, min 1. */
function hpProportional(ctx: PowerContext): number {
  return Math.max(1, Math.floor((150 * ctx.attackerHpPercent) / 100));
}

/** Reversal / Flail: HP-fraction threshold table (Gen IV+). */
function hpInverse(ctx: PowerContext): number {
  const p = Math.floor((48 * ctx.attackerHpPercent) / 100);
  if (p <= 1) return 200;
  if (p <= 4) return 150;
  if (p <= 9) return 100;
  if (p <= 16) return 80;
  if (p <= 32) return 40;
  return 20;
}

/** Gyro Ball: min(150, floor(25 × targetSpe / userSpe) + 1). */
function gyroBall(ctx: PowerContext): number {
  const user = Math.max(1, ctx.attackerSpe);
  return Math.min(150, Math.floor((25 * ctx.defenderSpe) / user) + 1);
}

/** Electro Ball: user/target speed ratio thresholds. */
function electroBall(ctx: PowerContext): number {
  const target = Math.max(1, ctx.defenderSpe);
  const r = ctx.attackerSpe / target;
  if (r >= 4) return 150;
  if (r >= 3) return 130;
  if (r >= 2) return 120;
  if (r >= 1) return 80;
  return 60;
}

/** Hard Press: 100 × targetCurrentHP/maxHP, min 1. */
function hardPress(ctx: PowerContext): number {
  return Math.max(1, Math.floor((100 * ctx.defenderHpPercent) / 100));
}

/** Crush Grip / Wring Out: 120 × targetCurrentHP/maxHP, min 1. */
function crushGrip(ctx: PowerContext): number {
  return Math.max(1, Math.floor((120 * ctx.defenderHpPercent) / 100));
}

/** Low Kick / Grass Knot: power scales with the TARGET's weight (kg). */
function targetWeightPower(ctx: PowerContext): number {
  const w = ctx.defenderWeight;
  if (w >= 200) return 120;
  if (w >= 100) return 100;
  if (w >= 50) return 80;
  if (w >= 25) return 60;
  if (w >= 10) return 40;
  return 20;
}

/** Heavy Slam / Heat Crash: power scales with user/target weight ratio. */
function weightRatioPower(ctx: PowerContext): number {
  const target = Math.max(0.1, ctx.defenderWeight);
  const r = ctx.attackerWeight / target;
  if (r >= 5) return 120;
  if (r >= 4) return 100;
  if (r >= 3) return 80;
  if (r >= 2) return 60;
  return 40;
}

// ---------------------------------------------------------------------------
// Base-power modifier helpers (CHAINED, game-accurate)
// ---------------------------------------------------------------------------

/** ×2 base-power modifier gated on a checkbox condition. */
function condDouble(conditionKey: string) {
  return (ctx: PowerContext): number[] => (ctx.conditions[conditionKey] ? [M.DOUBLE] : []);
}

// ---------------------------------------------------------------------------
// Hit-count shorthands
// ---------------------------------------------------------------------------

const HIT2: Pick<MoveMechanics, "hitCount"> = { hitCount: { min: 2, max: 2 } };
const HIT3: Pick<MoveMechanics, "hitCount"> = { hitCount: { min: 3, max: 3 } };
const HIT_2_5: Pick<MoveMechanics, "hitCount"> = { hitCount: { min: 2, max: 5 } };

// ---------------------------------------------------------------------------
// Move classification
// ---------------------------------------------------------------------------

/** Variable-power moves whose base power is null/0 in data but computable here. */
export const VARIABLE_POWER_MOVES: ReadonlySet<string> = new Set([
  "eruption",
  "water-spout",
  "reversal",
  "flail",
  "gyro-ball",
  "electro-ball",
  "hard-press",
  "crush-grip",
  "wring-out",
  "low-kick",
  "grass-knot",
  "heavy-slam",
  "heat-crash",
  "triple-axel",
]);

const DEFAULTS = (category: MoveCategory): MoveMechanics => ({
  offensiveStat: category === "special" ? "spa" : "atk",
  defensiveStat: category === "special" ? "spd" : "def",
  useTargetAttack: false,
  attackerExtraStats: [],
  defenderExtraStats: [],
  usesAttackerHp: false,
  usesWeight: false,
  conditions: [],
});

/**
 * Resolve the mechanics for a move by identifier + category.
 */
export function getMoveMechanics(identifier: string, category: MoveCategory): MoveMechanics {
  const base = DEFAULTS(category);

  switch (identifier) {
    // --- Attacker HP proportional ---
    case "eruption":
    case "water-spout":
      return { ...base, usesAttackerHp: true, computeBasePower: hpProportional };

    // --- Attacker HP inverse ---
    case "reversal":
    case "flail":
      return { ...base, usesAttackerHp: true, computeBasePower: hpInverse };

    // --- Speed based ---
    case "gyro-ball":
      return {
        ...base,
        attackerExtraStats: ["spe"],
        defenderExtraStats: ["spe"],
        computeBasePower: gyroBall,
      };
    case "electro-ball":
      return {
        ...base,
        offensiveStat: "spa",
        defensiveStat: "spd",
        attackerExtraStats: ["spe"],
        defenderExtraStats: ["spe"],
        computeBasePower: electroBall,
      };

    // --- Defender HP based ---
    case "hard-press":
      return { ...base, computeBasePower: hardPress };
    case "crush-grip":
    case "wring-out":
      return { ...base, computeBasePower: crushGrip };

    // --- Weight based ---
    case "low-kick":
    case "grass-knot":
      return { ...base, usesWeight: true, computeBasePower: targetWeightPower };
    case "heavy-slam":
    case "heat-crash":
      return { ...base, usesWeight: true, computeBasePower: weightRatioPower };

    // --- Stat reference morphing ---
    case "body-press":
      return { ...base, offensiveStat: "def" };
    case "foul-play":
      return { ...base, useTargetAttack: true, defenderExtraStats: ["atk"] };
    case "psyshock":
    case "psystrike":
    case "secret-sword":
      return { ...base, defensiveStat: "def" };

    // --- Conditional doublers (checkbox) ---
    case "hex":
      return {
        ...base,
        conditions: [{ key: "targetStatus", labelKey: "damageCalc.condTargetStatus" }],
        bpModifiers: condDouble("targetStatus"),
      };
    case "facade":
      return {
        ...base,
        conditions: [{ key: "userStatus", labelKey: "damageCalc.condUserStatus" }],
        bpModifiers: condDouble("userStatus"),
      };
    case "venoshock":
      return {
        ...base,
        conditions: [{ key: "targetPoisoned", labelKey: "damageCalc.condTargetPoisoned" }],
        bpModifiers: condDouble("targetPoisoned"),
      };
    case "round":
      return {
        ...base,
        conditions: [{ key: "allyRound", labelKey: "damageCalc.condAllyRound" }],
        bpModifiers: condDouble("allyRound"),
      };
    case "dragon-rush":
    case "steamroller":
    case "stomp":
    case "body-slam":
      return {
        ...base,
        conditions: [{ key: "targetMinimized", labelKey: "damageCalc.condTargetMinimized" }],
        bpModifiers: condDouble("targetMinimized"),
      };
    case "stomping-tantrum":
    case "temper-flare":
      return {
        ...base,
        conditions: [{ key: "prevMoveFailed", labelKey: "damageCalc.condPrevMoveFailed" }],
        bpModifiers: condDouble("prevMoveFailed"),
      };
    case "assurance":
      return {
        ...base,
        conditions: [{ key: "targetDamaged", labelKey: "damageCalc.condTargetDamaged" }],
        bpModifiers: condDouble("targetDamaged"),
      };
    case "payback":
      return {
        ...base,
        conditions: [{ key: "movesAfterTarget", labelKey: "damageCalc.condMovesAfterTarget" }],
        bpModifiers: condDouble("movesAfterTarget"),
      };
    case "earthquake":
    case "magnitude":
      return {
        ...base,
        conditions: [{ key: "targetUnderground", labelKey: "damageCalc.condTargetUnderground" }],
        bpModifiers: condDouble("targetUnderground"),
      };

    // --- Conditional doublers / boosters (auto from field & item) ---
    case "knock-off":
      return {
        ...base,
        bpModifiers: (ctx) => (ctx.defenderHasItem ? [M.KNOCK_OFF] : []),
      };
    case "rising-voltage":
      return {
        ...base,
        bpModifiers: (ctx) => (ctx.terrain === "electric" ? [M.DOUBLE] : []),
      };
    case "expanding-force":
      return {
        ...base,
        bpModifiers: (ctx) => (ctx.terrain === "psychic" ? [M.EXPANDING_FORCE] : []),
      };

    // --- Type effectiveness override ---
    case "freeze-dry":
      return { ...base, freezeDry: true };

    // ---------------------------------------------------------------------------
    // Multi-hit moves
    // ---------------------------------------------------------------------------

    // Fixed 2 hits
    case "double-hit":
    case "dual-wingbeat":
    case "dual-chop":
    case "dragon-darts":
    case "gear-grind":
    case "bonemerang":
    case "double-kick":
    case "twineedle":
      return { ...base, ...HIT2 };

    // Fixed 3 hits
    case "triple-kick":
      return { ...base, ...HIT3 };

    // Triple Axel: 3 hits with escalating BP (20/40/60 = 120 total).
    // We pass the summed BP (120) to the engine for a realistic single-calc
    // result, and mark hitCountAlreadyMerged so the UI doesn't multiply again.
    case "triple-axel":
      return {
        ...base,
        computeBasePower: () => 120,
        hitCount: { min: 3, max: 3 },
        hitCountAlreadyMerged: true,
      };

    // 2–5 random hits
    case "bone-rush":
    case "bullet-seed":
    case "icicle-spear":
    case "pin-missile":
    case "rock-blast":
    case "scale-shot":
    case "tail-slap":
    case "water-shuriken":
    case "arm-thrust":
    case "fury-attack":
    case "fury-swipes":
    case "comet-punch":
    case "spike-cannon":
    case "barrage":
      return { ...base, ...HIT_2_5 };

    // Population Bomb: 1–10 hits (skill-link makes it always 10)
    case "population-bomb":
      return { ...base, hitCount: { min: 1, max: 10 } };

    default:
      return base;
  }
}

/**
 * Weather-ball / Terrain-pulse resolve their type (and double power) from the
 * field. Returns the resolved type + power, or null when the move isn't one of
 * these field-reactive moves.
 */
export function resolveFieldReactiveMove(
  identifier: string,
  weather: "none" | "sun" | "rain" | "snow" | "sandstorm",
  terrain: Terrain,
  fallbackType: Type,
  fallbackPower: number,
): { type: Type; power: number } | null {
  if (identifier === "weather-ball") {
    switch (weather) {
      case "sun":
        return { type: "fire", power: fallbackPower * 2 };
      case "rain":
        return { type: "water", power: fallbackPower * 2 };
      case "snow":
        return { type: "ice", power: fallbackPower * 2 };
      case "sandstorm":
        return { type: "rock", power: fallbackPower * 2 };
      default:
        return { type: "normal", power: fallbackPower };
    }
  }
  if (identifier === "terrain-pulse") {
    switch (terrain) {
      case "electric":
        return { type: "electric", power: fallbackPower * 2 };
      case "grassy":
        return { type: "grass", power: fallbackPower * 2 };
      case "misty":
        return { type: "fairy", power: fallbackPower * 2 };
      case "psychic":
        return { type: "psychic", power: fallbackPower * 2 };
      default:
        return { type: fallbackType, power: fallbackPower };
    }
  }
  return null;
}

/** Normal→X "-ate" abilities and Normalize. */
const ATE_TYPES: Readonly<Record<string, Type>> = {
  pixilate: "fairy",
  aerilate: "flying",
  refrigerate: "ice",
  galvanize: "electric",
};

/**
 * Ability-driven move-type change (Pixilate / Aerilate / Refrigerate /
 * Galvanize / Normalize). Returns the new type + whether the ~1.2x boost
 * applies, or null when the ability doesn't change the move's type.
 */
export function resolveAbilityTypeChange(
  ability: string | null,
  moveType: Type,
): { type: Type; boosted: boolean } | null {
  if (!ability) return null;
  const ateType = ATE_TYPES[ability];
  if (ateType && moveType === "normal") {
    return { type: ateType, boosted: true };
  }
  if (ability === "normalize" && moveType !== "normal") {
    return { type: "normal", boosted: true };
  }
  return null;
}
