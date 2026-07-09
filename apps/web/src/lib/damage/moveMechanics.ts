import type { MoveCategory, Type } from "@/types/pokemon";

/**
 * Move mechanics classification for the damage calculator UI.
 *
 * The damage engine (Rust/WASM) receives a *resolved* base power and *resolved*
 * attack/defense values. Everything about "which stat feeds the formula" and
 * "how the base power varies with the battle state" is decided here, in the TS
 * layer, so the UI can:
 *   1. Show only the stats a move actually needs (progressive disclosure).
 *   2. Compute the effective base power from dynamic inputs (HP%, speed, ...).
 *   3. Offer conditional-power toggles (Hex, Facade, Venoshock, ...).
 *
 * Only well-defined, data-available mechanics are modelled. Weight-based moves
 * (Grass Knot, Low Kick, Heavy Slam) are intentionally omitted because weight
 * is not present in the move data.
 */

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

/** A checkbox shown under the move that conditionally changes its power. */
export type MoveConditionDef = {
  readonly key: string; // stored in PokemonPanelState.moveConditions
  readonly labelKey: string; // i18n key
};

/** Context passed to a variable-power resolver. */
export type PowerContext = {
  /** Static base power from move data (may be 0 / low for variable moves). */
  readonly basePower: number;
  /** Attacker current HP as a percentage (0–100). */
  readonly attackerHpPercent: number;
  /** Defender current HP as a percentage (0–100). */
  readonly defenderHpPercent: number;
  /** Attacker Speed actual value. */
  readonly attackerSpe: number;
  /** Defender Speed actual value. */
  readonly defenderSpe: number;
  /** Attacker weight in kilograms. */
  readonly attackerWeight: number;
  /** Defender weight in kilograms. */
  readonly defenderWeight: number;
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
  /** Whether the move's power derives from Pokémon weight (Low Kick, Heavy Slam, ...). */
  readonly usesWeight: boolean;
  /** Compute effective base power. undefined ⇒ use the static move power as-is. */
  readonly computeBasePower?: (ctx: PowerContext) => number;
  /** Conditional-power toggles shown under the move. */
  readonly conditions: readonly MoveConditionDef[];
  /** Type effectiveness override shift (e.g. Freeze-Dry hits Water super-effectively). */
  readonly freezeDry?: boolean;
};

// ---------------------------------------------------------------------------
// Base-power formulas
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

/** Generic conditional doubler (Hex / Facade / Venoshock). */
function conditionalDouble(conditionKey: string) {
  return (ctx: PowerContext): number =>
    ctx.conditions[conditionKey] ? ctx.basePower * 2 : ctx.basePower;
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
      // Scales with the target's weight.
      return { ...base, usesWeight: true, computeBasePower: targetWeightPower };
    case "heavy-slam":
    case "heat-crash":
      // Scales with the user/target weight ratio.
      return { ...base, usesWeight: true, computeBasePower: weightRatioPower };

    // --- Stat reference morphing ---
    case "body-press":
      // Physical move that uses the user's Defense as the offensive stat.
      return { ...base, offensiveStat: "def" };
    case "foul-play":
      // Uses the defender's Attack stat.
      return { ...base, useTargetAttack: true, defenderExtraStats: ["atk"] };
    case "psyshock":
    case "psystrike":
    case "secret-sword":
      // Special move that targets the defender's Defense.
      return { ...base, defensiveStat: "def" };

    // --- Conditional doublers ---
    case "hex":
      return {
        ...base,
        conditions: [{ key: "targetStatus", labelKey: "damageCalc.condTargetStatus" }],
        computeBasePower: conditionalDouble("targetStatus"),
      };
    case "facade":
      return {
        ...base,
        conditions: [{ key: "userStatus", labelKey: "damageCalc.condUserStatus" }],
        computeBasePower: conditionalDouble("userStatus"),
      };
    case "venoshock":
      return {
        ...base,
        conditions: [{ key: "targetPoisoned", labelKey: "damageCalc.condTargetPoisoned" }],
        computeBasePower: conditionalDouble("targetPoisoned"),
      };

    // --- Type effectiveness override ---
    case "freeze-dry":
      return { ...base, freezeDry: true };

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
  terrain: "none" | "electric" | "grassy" | "misty" | "psychic",
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
