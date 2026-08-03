import { match, P } from "ts-pattern";
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
  readonly type?: "boolean" | "number";
  readonly min?: number;
  readonly max?: number;
  readonly defaultValue?: number;
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
  /** Active weather. */
  readonly weather: "none" | "sun" | "rain" | "snow" | "sandstorm";
  /** Whether the attacker is grounded. */
  readonly attackerGrounded: boolean;
  /** Whether the defender is grounded. */
  readonly defenderGrounded: boolean;
  /** Whether the defender is holding a (removable) item — for Knock Off. */
  readonly defenderHasItem: boolean;
  /** Whether the attacker is holding an item — for Acrobatics. */
  readonly attackerHasItem: boolean;
  /** The specific item identifier the attacker is holding, if any. */
  readonly attackerItem: string | null;
  /** Move-condition checkbox/numeric states (keyed by MoveConditionDef.key). */
  readonly conditions: Readonly<Record<string, boolean | number>>;
  /** Whether gravity is active. */
  readonly gravity: boolean;
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
  /** Ignores target's defense boosts. */
  readonly ignoresTargetDefenseBoosts?: boolean;
  /** Always results in a critical hit. */
  readonly alwaysCrit?: boolean;
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
  "last-respects",
  "rage-fist",
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

function flingPower(item: string | null): number {
  if (!item) return 0;
  if (item === "iron-ball" || item.endsWith("-tr")) return 130;
  if (item.endsWith("-plate") || item === "hard-stone" || item === "thick-club") return 90;
  if (
    item === "dusk-stone" ||
    item === "shiny-stone" ||
    item === "dawn-stone" ||
    item === "oval-stone" ||
    item === "ice-stone" ||
    item === "heavy-duty-boots" ||
    item === "assault-vest" ||
    item === "weakness-policy" ||
    item === "blunder-policy"
  )
    return 80;
  if (item === "poison-barb" || item === "dragon-fang") return 70;
  if (item === "rocky-helmet" || item === "macho-brace") return 60;
  if (
    item === "light-clay" ||
    item === "flame-orb" ||
    item === "toxic-orb" ||
    item === "light-ball" ||
    item === "kings-rock" ||
    item === "life-orb" ||
    item === "expert-belt" ||
    item === "black-glasses" ||
    item === "charcoal" ||
    item === "mystic-water" ||
    item === "magnet" ||
    item === "miracle-seed" ||
    item === "never-melt-ice" ||
    item === "spell-tag" ||
    item === "twisted-spoon" ||
    item === "silver-powder" ||
    item === "soft-sand" ||
    item === "metal-coat" ||
    item === "silk-scarf" ||
    item === "sharp-beak" ||
    item === "black-belt"
  )
    return 30;
  if (
    item.endsWith("-berry") ||
    item.startsWith("choice-") ||
    item === "focus-sash" ||
    item === "focus-band" ||
    item === "leftovers" ||
    item === "black-sludge" ||
    item === "white-herb" ||
    item === "mental-herb" ||
    item === "power-herb"
  )
    return 10;
  return 30; // Default fallback
}

/**
 * Resolve the mechanics for a move by identifier + category.
 */
export function getMoveMechanics(identifier: string, category: MoveCategory): MoveMechanics {
  const base = DEFAULTS(category);

  return (
    match(identifier)
      // --- Base Power Modifiers (Last Respects, Rage Fist) ---
      .with("last-respects", () => ({
        ...base,
        conditions: [
          {
            key: "faintedAllies",
            labelKey: "damageCalc.condFaintedAllies",
            type: "number" as const,
            min: 0,
            max: 5,
            defaultVal: 0,
          },
        ],
        computeBasePower: (ctx: PowerContext) => {
          const fainted = (ctx.conditions["faintedAllies"] as number) ?? 0;
          return 50 + 50 * fainted;
        },
      }))
      .with(P.union("stored-power", "power-trip"), () => ({
        ...base,
        conditions: [
          {
            key: "totalBoosts",
            labelKey: "damageCalc.condTotalBoosts",
            type: "number" as const,
            min: 0,
            max: 42,
            defaultVal: 0,
          },
        ],
        computeBasePower: (ctx: PowerContext) => {
          const boosts = (ctx.conditions["totalBoosts"] as number) ?? 0;
          return 20 + 20 * boosts;
        },
      }))
      .with("beat-up", () => ({
        ...base,
        hitCount: { min: 1, max: 6 },
        conditions: [
          {
            key: "beatUpBP",
            labelKey: "damageCalc.condBeatUpBP",
            type: "number" as const,
            min: 5,
            max: 25,
            defaultVal: 15, // average
          },
        ],
        computeBasePower: (ctx: PowerContext) => {
          return (ctx.conditions["beatUpBP"] as number) ?? 15;
        },
      }))
      // --- Base Power Overrides ---
      .with(P.union("flail", "reversal"), () => ({
        ...base,
        usesAttackerHp: true,
        computeBasePower: (ctx: PowerContext) => {
          const p = ctx.attackerHpPercent;
          if (p <= 4.17) return 200;
          if (p <= 10.42) return 150;
          if (p <= 20.84) return 100;
          if (p <= 35.42) return 80;
          if (p <= 68.75) return 40;
          return 20;
        },
      }))
      .with("fling", () => ({
        ...base,
        computeBasePower: (ctx: PowerContext) => flingPower(ctx.attackerItem),
      }))
      .with("eruption", "water-spout", "dragon-energy", () => ({
        ...base,
        conditions: [
          {
            key: "faintedAllies",
            labelKey: "damageCalc.condFaintedAllies",
            type: "number",
            min: 0,
            max: 5, // Up to 5 fainted allies (typically, can be more with revive but 5 is standard max for singles/doubles normal mode)
            defaultValue: 0,
          },
        ] as const,
        computeBasePower: (ctx: PowerContext) => {
          const faints =
            typeof ctx.conditions.faintedAllies === "number" ? ctx.conditions.faintedAllies : 0;
          return ctx.basePower + 50 * faints;
        },
      }))
      .with("rage-fist", () => ({
        ...base,
        conditions: [
          {
            key: "timesHit",
            labelKey: "damageCalc.condTimesHit",
            type: "number",
            min: 0,
            max: 6, // Maxes out at 6 hits (350 BP)
            defaultValue: 0,
          },
        ] as const,
        computeBasePower: (ctx: PowerContext) => {
          const hits = typeof ctx.conditions.timesHit === "number" ? ctx.conditions.timesHit : 0;
          return ctx.basePower + 50 * Math.min(6, hits);
        },
      }))

      // --- Attacker HP proportional ---
      .with(P.union("eruption", "water-spout"), () => ({
        ...base,
        usesAttackerHp: true,
        computeBasePower: hpProportional,
      }))

      // --- Attacker HP inverse ---
      .with(P.union("reversal", "flail"), () => ({
        ...base,
        usesAttackerHp: true,
        computeBasePower: hpInverse,
      }))

      // --- Speed based ---
      .with("gyro-ball", () => ({
        ...base,
        attackerExtraStats: ["spe"] as const,
        defenderExtraStats: ["spe"] as const,
        computeBasePower: gyroBall,
      }))
      .with("electro-ball", () => ({
        ...base,
        offensiveStat: "spa" as const,
        defensiveStat: "spd" as const,
        attackerExtraStats: ["spe"] as const,
        defenderExtraStats: ["spe"] as const,
        computeBasePower: electroBall,
      }))

      // --- Defender HP based ---
      .with("hard-press", () => ({ ...base, computeBasePower: hardPress }))
      .with(P.union("crush-grip", "wring-out"), () => ({ ...base, computeBasePower: crushGrip }))

      // --- Weight based ---
      .with(P.union("low-kick", "grass-knot"), () => ({
        ...base,
        usesWeight: true,
        computeBasePower: targetWeightPower,
      }))
      .with(P.union("heavy-slam", "heat-crash"), () => ({
        ...base,
        usesWeight: true,
        computeBasePower: weightRatioPower,
        conditions: [{ key: "targetMinimized", labelKey: "damageCalc.condTargetMinimized" }],
        bpModifiers: condDouble("targetMinimized"),
      }))

      // --- Stat reference morphing ---
      .with("body-press", () => ({ ...base, offensiveStat: "def" as const }))
      .with("foul-play", () => ({
        ...base,
        useTargetAttack: true,
        defenderExtraStats: ["atk"] as const,
      }))
      .with(P.union("psyshock", "psystrike", "secret-sword"), () => ({
        ...base,
        defensiveStat: "def" as const,
      }))
      .with(P.union("darkest-lariat", "sacred-sword", "chip-away"), () => ({
        ...base,
        ignoresTargetDefenseBoosts: true,
      }))
      .with(
        P.union(
          "wicked-blow",
          "surging-strikes",
          "flower-trick",
          "frost-breath",
          "storm-throw",
          "zippy-zap",
        ),
        () => ({ ...base, alwaysCrit: true }),
      )

      // --- Conditional doublers (checkbox) ---
      .with(P.union("hex", "infernal-parade"), () => ({
        ...base,
        conditions: [{ key: "targetStatus", labelKey: "damageCalc.condTargetStatus" }],
        bpModifiers: condDouble("targetStatus"),
      }))
      .with("facade", () => ({
        ...base,
        conditions: [{ key: "userStatus", labelKey: "damageCalc.condUserStatus" }],
        bpModifiers: condDouble("userStatus"),
      }))
      .with(P.union("venoshock", "barb-barrage"), () => ({
        ...base,
        conditions: [{ key: "targetPoisoned", labelKey: "damageCalc.condTargetPoisoned" }],
        bpModifiers: condDouble("targetPoisoned"),
      }))
      .with("round", () => ({
        ...base,
        conditions: [{ key: "allyRound", labelKey: "damageCalc.condAllyRound" }],
        bpModifiers: condDouble("allyRound"),
      }))
      .with(P.union("dragon-rush", "steamroller", "stomp", "body-slam"), () => ({
        ...base,
        conditions: [{ key: "targetMinimized", labelKey: "damageCalc.condTargetMinimized" }],
        bpModifiers: condDouble("targetMinimized"),
      }))
      .with(P.union("solar-beam", "solar-blade"), () => ({
        ...base,
        bpModifiers: (ctx: PowerContext) => {
          if (ctx.weather === "rain" || ctx.weather === "sandstorm" || ctx.weather === "snow") {
            return [M.WEATHER_PENALTY]; // 0.5x
          }
          return [];
        },
      }))
      .with(P.union("stomping-tantrum", "temper-flare"), () => ({
        ...base,
        conditions: [{ key: "prevMoveFailed", labelKey: "damageCalc.condPrevMoveFailed" }],
        bpModifiers: condDouble("prevMoveFailed"),
      }))
      .with("assurance", () => ({
        ...base,
        conditions: [{ key: "targetDamaged", labelKey: "damageCalc.condTargetDamaged" }],
        bpModifiers: condDouble("targetDamaged"),
      }))
      .with("payback", () => ({
        ...base,
        conditions: [{ key: "movesAfterTarget", labelKey: "damageCalc.condMovesAfterTarget" }],
        bpModifiers: condDouble("movesAfterTarget"),
      }))
      .with(P.union("earthquake", "magnitude"), () => ({
        ...base,
        conditions: [{ key: "targetUnderground", labelKey: "damageCalc.condTargetUnderground" }],
        bpModifiers: condDouble("targetUnderground"),
      }))
      .with(P.union("surf", "whirlpool"), () => ({
        ...base,
        conditions: [{ key: "targetSubmerged", labelKey: "damageCalc.condTargetSubmerged" }],
        bpModifiers: condDouble("targetSubmerged"),
      }))
      .with("avalanche", () => ({
        ...base,
        conditions: [{ key: "targetDamagedUser", labelKey: "damageCalc.condTargetDamagedUser" }],
        bpModifiers: condDouble("targetDamagedUser"),
      }))
      .with("retaliate", () => ({
        ...base,
        conditions: [{ key: "allyFainted", labelKey: "damageCalc.condAllyFainted" }],
        bpModifiers: condDouble("allyFainted"),
      }))
      .with("pursuit", () => ({
        ...base,
        conditions: [{ key: "targetSwitching", labelKey: "damageCalc.condTargetSwitching" }],
        bpModifiers: condDouble("targetSwitching"),
      }))
      .with("lash-out", () => ({
        ...base,
        conditions: [{ key: "statsLowered", labelKey: "damageCalc.condStatsLowered" }],
        bpModifiers: condDouble("statsLowered"),
      }))
      .with("grav-apple", () => ({
        ...base,
        bpModifiers: (ctx: PowerContext) => (ctx.gravity ? [M.TERRAIN_OFFENSIVE] : []),
      }))

      // --- Conditional doublers / boosters (auto from field & item) ---
      .with("knock-off", () => ({
        ...base,
        bpModifiers: (ctx: PowerContext) => (ctx.defenderHasItem ? [M.KNOCK_OFF] : []),
      }))
      .with("acrobatics", () => ({
        ...base,
        bpModifiers: (ctx: PowerContext) => (!ctx.attackerHasItem ? [M.DOUBLE] : []),
      }))
      .with("rising-voltage", () => ({
        ...base,
        bpModifiers: (ctx: PowerContext) =>
          ctx.terrain === "electric" && ctx.defenderGrounded ? [M.DOUBLE] : [],
      }))
      .with("expanding-force", () => ({
        ...base,
        bpModifiers: (ctx: PowerContext) =>
          ctx.terrain === "psychic" && ctx.attackerGrounded ? [M.EXPANDING_FORCE] : [],
      }))
      .with("misty-explosion", () => ({
        ...base,
        bpModifiers: (ctx: PowerContext) =>
          ctx.terrain === "misty" && ctx.attackerGrounded ? [M.TERRAIN_OFFENSIVE] : [],
      }))

      // --- Type effectiveness override ---
      .with("freeze-dry", () => ({ ...base, freezeDry: true }))

      // ---------------------------------------------------------------------------
      // Multi-hit moves
      // ---------------------------------------------------------------------------

      // Fixed 2 hits
      .with(
        P.union(
          "double-hit",
          "dual-wingbeat",
          "dual-chop",
          "dragon-darts",
          "gear-grind",
          "bonemerang",
          "double-kick",
          "twineedle",
        ),
        () => ({ ...base, ...HIT2 }),
      )

      // Fixed 3 hits
      .with("triple-kick", () => ({ ...base, ...HIT3 }))

      // Triple Axel: 3 hits with escalating BP
      .with("triple-axel", () => ({
        ...base,
        computeBasePower: () => 120,
        hitCount: { min: 3, max: 3 },
        hitCountAlreadyMerged: true,
      }))

      // 2–5 random hits
      .with(
        P.union(
          "bone-rush",
          "bullet-seed",
          "icicle-spear",
          "pin-missile",
          "rock-blast",
          "scale-shot",
          "tail-slap",
          "water-shuriken",
          "arm-thrust",
          "fury-attack",
          "fury-swipes",
          "comet-punch",
          "spike-cannon",
          "barrage",
        ),
        () => ({ ...base, ...HIT_2_5 }),
      )

      // Population Bomb
      .with("population-bomb", () => ({ ...base, hitCount: { min: 1, max: 10 } }))

      .otherwise(() => base)
  );
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
    return match(weather)
      .with("sun", () => ({ type: "fire" as Type, power: fallbackPower * 2 }))
      .with("rain", () => ({ type: "water" as Type, power: fallbackPower * 2 }))
      .with("snow", () => ({ type: "ice" as Type, power: fallbackPower * 2 }))
      .with("sandstorm", () => ({ type: "rock" as Type, power: fallbackPower * 2 }))
      .otherwise(() => ({ type: "normal" as Type, power: fallbackPower }));
  }
  if (identifier === "terrain-pulse") {
    return match(terrain)
      .with("electric", () => ({ type: "electric" as Type, power: fallbackPower * 2 }))
      .with("grassy", () => ({ type: "grass" as Type, power: fallbackPower * 2 }))
      .with("misty", () => ({ type: "fairy" as Type, power: fallbackPower * 2 }))
      .with("psychic", () => ({ type: "psychic" as Type, power: fallbackPower * 2 }))
      .otherwise(() => ({ type: fallbackType, power: fallbackPower }));
  }
  return null;
}

/** Normal→X "-ate" abilities and Normalize. */
const ATE_TYPES: Readonly<Record<string, Type>> = {
  pixilate: "fairy",
  aerilate: "flying",
  refrigerate: "ice",
  galvanize: "electric",
  dragonize: "dragon",
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
