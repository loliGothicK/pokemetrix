import { useMemo, useState, useEffect } from "react";
import { useDamageCalc, type UseDamageCalcResult } from "@/hooks/useDamageCalc";
import {
  weatherModifier,
  terrainModifier,
  terrainDefensiveModifier,
  stabModifier,
  screenModifier,
  spreadModifier,
  isPhysicalCategory,
  getMoveMechanics,
  resolveFieldReactiveMove,
  resolveAbilityTypeChange,
  freezeDryOverride,
  tarShotFireOverride,
  type Weather,
  type Terrain,
  type DamageInput,
  type PowerContext,
  M,
} from "@/lib/damage";
import type { Type } from "@/types/pokemon";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";
import type { StatKey } from "@/lib/damage/moveMechanics";
import { moveByIdentifier } from "@/data/moves";
import { pokemonById } from "@/data/pokemon";
import { calcHp, calcStatus } from "@/data/utility/training";

export type PokemonPanelState = {
  readonly identifier: string | null;
  readonly move: string | null;
  readonly ability: string | null;
  readonly item: string | null;
  readonly boosts: Partial<Record<StatKey, number>>;
  readonly evHp: number;
  readonly evAtk: number;
  readonly evDef: number;
  readonly evSpa: number;
  readonly evSpd: number;
  readonly evSpe: number;
  /** Current HP as a percentage (0–100). Defaults to 100. */
  readonly hpPercent: number;
  /** General condition toggles (burn / helpingHand / tailwind / paralysis / ...). */
  readonly conditions: Readonly<Record<string, boolean>>;
  /** Attacker only: conditional-power toggles keyed by move-condition id. */
  readonly moveConditions: Readonly<Record<string, boolean | number>>;
  /** Attacker only: conditional item toggles/numbers. */
  readonly itemConditions: Readonly<Record<string, boolean | number>>;
  /** Nature multipliers keyed by stat (1.1, 1.0, 0.9). */
  readonly natures: Readonly<Partial<Record<StatKey, number>>>;
};

export type DamageCalcResult = {
  readonly output: UseDamageCalcResult["output"];
  readonly analysis: UseDamageCalcResult["analysis"];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly missingReason: "attacker" | "move" | "defender" | null;
  /** Multi-hit count for the selected move. undefined or {min:1,max:1} = single hit. */
  readonly hitCount: { readonly min: number; readonly max: number } | undefined;
  /**
   * When true the engine base power already accounts for all hits
   * (Triple Axel), so the UI shows "× N hits" as a label only without
   * multiplying the roll numbers.
   */
  readonly hitCountAlreadyMerged: boolean;
};

const defaultPanel: PokemonPanelState = {
  identifier: null,
  move: null,
  ability: null,
  item: null,
  boosts: {},
  evHp: 0,
  evAtk: 0,
  evDef: 0,
  evSpa: 0,
  evSpd: 0,
  evSpe: 0,
  hpPercent: 100,
  conditions: {},
  moveConditions: {},
  itemConditions: {},
  natures: {},
};

/** Speed after Rank, Item, Ability, Tailwind, and Paralysis. */
function effectiveSpeed(
  base: number,
  boost: number,
  item: string | null,
  ability: string | null,
  weather: Weather,
  terrain: Terrain,
  conditions: Readonly<Record<string, boolean>>,
): number {
  let s = base;
  // 1. Apply stat rank
  const num = Math.max(2, 2 + boost);
  const den = Math.max(2, 2 - boost);
  s = Math.floor((s * num) / den);

  // 2. Apply weather/terrain/abilities
  if (ability === "chlorophyll" && weather === "sun") {
    s = Math.floor((s * 8192) / 4096);
  } else if (ability === "swift-swim" && weather === "rain") {
    s = Math.floor((s * 8192) / 4096);
  } else if (ability === "sand-rush" && weather === "sandstorm") {
    s = Math.floor((s * 8192) / 4096);
  } else if (ability === "slush-rush" && weather === "snow") {
    s = Math.floor((s * 8192) / 4096);
  } else if (ability === "surge-surfer" && terrain === "electric") {
    s = Math.floor((s * 8192) / 4096);
  } else if (
    ability === "quick-feet" &&
    (conditions.paralysis || conditions.burn || conditions.poison || conditions.sleep)
  ) {
    s = Math.floor((s * 6144) / 4096);
  }

  // 3. Apply item
  if (item === "choice-scarf") {
    s = Math.floor((s * 6144) / 4096); // 1.5x
  } else if (
    item === "iron-ball" ||
    item === "macho-brace" ||
    item === "power-weight" ||
    item === "power-bracer" ||
    item === "power-belt" ||
    item === "power-lens" ||
    item === "power-band" ||
    item === "power-anklet"
  ) {
    s = Math.floor((s * 2048) / 4096); // 0.5x
  }

  // 4. Apply field conditions
  if (conditions.tailwind) {
    s = Math.floor((s * 8192) / 4096); // 2.0x
  }
  if (conditions.paralysis && ability !== "quick-feet") {
    s = Math.floor((s * 2048) / 4096); // 0.5x
  }

  return s;
}

/** Whether a Pokémon is grounded (affected by Terrain). Levitate / Flying float. */
function isGrounded(types: readonly Type[], ability: string | null, gravity: boolean): boolean {
  if (gravity) return true;
  if (ability === "levitate") return false;
  return !types.includes("flying");
}

export function useDamageCalcPage() {
  const [attacker, setAttacker] = useState<PokemonPanelState>(defaultPanel);
  const [defender, setDefender] = useState<PokemonPanelState>(defaultPanel);
  const [weather, setWeather] = useState<Weather>("none");
  const [terrain, setTerrain] = useState<Terrain>("none");
  const [fairyAura, setFairyAura] = useState(false);
  const [wonderRoom, setWonderRoom] = useState(false);
  const [gravity, setGravity] = useState(false);
  const [screens, setScreens] = useState<{
    reflect: boolean;
    lightScreen: boolean;
    auroraVeil: boolean;
  }>({ reflect: false, lightScreen: false, auroraVeil: false });
  const [isDoubles, setIsDoubles] = useState(true);
  const [isCrit, setIsCrit] = useState(false);
  const critDisabled = defender.ability === "shell-armor" || defender.ability === "battle-armor";

  useEffect(() => {
    if (critDisabled) {
      setIsCrit(false);
    } else if (attacker.move) {
      const move = moveByIdentifier.get(attacker.move);
      if (move && move.category !== "status") {
        const mechanics = getMoveMechanics(move.identifier, move.category);
        if (mechanics.alwaysCrit) {
          setIsCrit(true);
        } else {
          setIsCrit(false);
        }
      }
    }
  }, [attacker.move, critDisabled]);

  const damageInput = useMemo((): DamageInput | null => {
    if (!attacker.identifier) return null;
    if (!attacker.move) return null;
    if (!defender.identifier) return null;

    const atkPokemon = championsPokemonByIdentifier.get(attacker.identifier);
    const defPokemon = championsPokemonByIdentifier.get(defender.identifier);
    const move = moveByIdentifier.get(attacker.move);

    if (!atkPokemon || !defPokemon || !move) return null;
    if (move.category === "status") return null;

    const mechanics = getMoveMechanics(move.identifier, move.category);
    const isPhysical = isPhysicalCategory(move.category);
    const ac = attacker.conditions;
    const dc = defender.conditions;

    // --- Resolve move type & static base power ---
    let moveType = move.type;
    let staticPower = move.power ?? 0;

    // 1) weather-ball / terrain-pulse
    const fieldResolved = resolveFieldReactiveMove(
      move.identifier,
      weather,
      terrain,
      move.type,
      move.power ?? 0,
    );
    if (fieldResolved) {
      moveType = fieldResolved.type;
      staticPower = fieldResolved.power;
    }

    // 2) ability-driven type change (-ate / Normalise)
    let ateBoost = false;
    const abilityType = resolveAbilityTypeChange(attacker.ability, moveType);
    if (abilityType) {
      moveType = abilityType.type;
      ateBoost = abilityType.boosted;
    }

    // 3) Electrify overrides the type to Electric
    if (ac.electrify) moveType = "electric";

    // --- Stat helpers ---
    const stat = (pokemon: typeof atkPokemon, idx: number, ev: number, nature: number = 1.0) =>
      calcStatus(pokemon.status[idx], ev, nature);

    const atkSpe = effectiveSpeed(
      stat(atkPokemon, 5, attacker.evSpe, attacker.natures?.spe),
      attacker.boosts["spe"] ?? 0,
      attacker.item,
      attacker.ability,
      weather,
      terrain,
      ac,
    );
    const defSpe = effectiveSpeed(
      stat(defPokemon, 5, defender.evSpe, defender.natures?.spe),
      defender.boosts["spe"] ?? 0,
      defender.item,
      defender.ability,
      weather,
      terrain,
      dc,
    );

    const atkWeight = (pokemonById.get(atkPokemon.id)?.weight ?? 0) / 10;
    const defWeight = (pokemonById.get(defPokemon.id)?.weight ?? 0) / 10;

    const attackerGrounded = isGrounded(atkPokemon.types, attacker.ability, gravity);
    const defenderGrounded = isGrounded(defPokemon.types, defender.ability, gravity);

    // --- Effective base power ---
    const powerCtx: PowerContext = {
      basePower: staticPower,
      attackerHpPercent: attacker.hpPercent,
      defenderHpPercent: defender.hpPercent,
      attackerSpe: atkSpe,
      defenderSpe: defSpe,
      attackerWeight: atkWeight,
      defenderWeight: defWeight,
      terrain,
      weather,
      attackerGrounded,
      defenderGrounded,
      defenderHasItem: defender.item !== null,
      attackerHasItem: attacker.item !== null,
      attackerItem: attacker.item,
      conditions: attacker.moveConditions,
      gravity,
    };
    const basePower = mechanics.computeBasePower
      ? mechanics.computeBasePower(powerCtx)
      : staticPower;

    if (basePower <= 0) return null;

    // --- Base-power modifiers ---
    const bpModifiers: number[] = [];
    if (attackerGrounded && terrainModifier(terrain, moveType) !== M.NEUTRAL) {
      bpModifiers.push(terrainModifier(terrain, moveType));
    }
    if (
      defenderGrounded &&
      terrainDefensiveModifier(terrain, moveType, move.identifier) !== M.NEUTRAL
    ) {
      bpModifiers.push(terrainDefensiveModifier(terrain, moveType, move.identifier));
    }
    if (attacker.item === "type-boost") bpModifiers.push(M.TYPE_ITEM);
    if (ateBoost) bpModifiers.push(M.ATE_BOOST);
    if (ac.helpingHand) bpModifiers.push(M.HELPING_HAND);
    if (ac.charge && moveType === "electric") bpModifiers.push(M.CHARGE);
    if (ac.steelySpirit && moveType === "steel") bpModifiers.push(M.STEELY_SPIRIT);
    if (attacker.ability === "fire-mane" && moveType === "fire") bpModifiers.push(M.STEELY_SPIRIT); // 1.5x base power
    if (ac.powerSpot) bpModifiers.push(M.POWER_SPOT);
    if (ac.battery && !isPhysical) bpModifiers.push(M.BATTERY);
    if (fairyAura && moveType === "fairy") bpModifiers.push(M.FAIRY_AURA);
    // Move-specific conditional modifiers (Hex, Knock Off, Rising Voltage, ...)
    for (const m of mechanics.bpModifiers?.(powerCtx) ?? []) bpModifiers.push(m);

    // Technician: ×1.5 when base power ≤ 60 (judged after computeBasePower,
    // i.e. on the fully-resolved single-hit BP, not the chain of modifiers).
    if (attacker.ability === "technician" && basePower <= 60) {
      bpModifiers.push(M.TECHNICIAN);
    }

    // --- Attacker stat values (Power Trick swaps Atk ⇄ Def) ---
    const atkAtkVal = stat(atkPokemon, 1, attacker.evAtk, attacker.natures?.atk);
    const atkDefVal = stat(atkPokemon, 2, attacker.evDef, attacker.natures?.def);
    const atkSpaVal = stat(atkPokemon, 3, attacker.evSpa, attacker.natures?.spa);
    const effAtkAtk = ac.powerTrick ? atkDefVal : atkAtkVal;
    const effAtkDef = ac.powerTrick ? atkAtkVal : atkDefVal;

    // --- Defender stat values (Power Trick swaps Atk ⇄ Def, then Wonder Room swaps Def ⇄ Sp.Def) ---
    const defAtkVal = stat(defPokemon, 1, defender.evAtk, defender.natures?.atk);
    const defDefRaw = stat(defPokemon, 2, defender.evDef, defender.natures?.def);
    const defSpdRaw = stat(defPokemon, 4, defender.evSpd, defender.natures?.spd);
    let effDefDef = dc.powerTrick ? defAtkVal : defDefRaw;
    let effDefSpd = defSpdRaw;
    if (wonderRoom) {
      const tmp = effDefDef;
      effDefDef = effDefSpd;
      effDefSpd = tmp;
    }
    const effDefAtk = dc.powerTrick ? defDefRaw : defAtkVal;

    // --- Offensive stat resolution ---
    let atkStat: number;
    let attackBoost: number;
    if (mechanics.useTargetAttack) {
      // Foul Play: uses the defender's (post-Power-Trick) Attack stat + rank.
      atkStat = effDefAtk;
      attackBoost = defender.boosts["atk"] ?? 0;
    } else if (mechanics.offensiveStat === "def") {
      // Body Press: uses the user's Defense stat.
      atkStat = effAtkDef;
      attackBoost = attacker.boosts["def"] ?? 0;
    } else {
      atkStat = mechanics.offensiveStat === "spa" ? atkSpaVal : effAtkAtk;
      attackBoost = attacker.boosts[mechanics.offensiveStat === "spa" ? "spa" : "atk"] ?? 0;
    }

    // --- Defensive stat resolution ---
    const defStat = mechanics.defensiveStat === "spd" ? effDefSpd : effDefDef;
    const defenseBoost = mechanics.ignoresTargetDefenseBoosts
      ? 0
      : (defender.boosts[mechanics.defensiveStat === "spd" ? "spd" : "def"] ?? 0);

    // --- Attack / Defense stat modifiers ---
    const attackModifiers: number[] = [];
    if (attacker.item === "choice-band" && isPhysical) attackModifiers.push(M.CHOICE);
    if (attacker.item === "choice-specs" && !isPhysical) attackModifiers.push(M.CHOICE);
    if (attacker.item === "muscle-band" && isPhysical) attackModifiers.push(4505);
    if (attacker.item === "wise-glasses" && !isPhysical) attackModifiers.push(4505);
    // Flower Gift (in sun): boosts the user's Atk on physical moves.
    if (ac.flowerGift && isPhysical) attackModifiers.push(M.FLOWER_GIFT);

    const defenseModifiers: number[] = [];
    // Flower Gift (in sun): boosts the target's Sp.Def on special moves.
    if (dc.flowerGift && !isPhysical) defenseModifiers.push(M.FLOWER_GIFT);

    // --- Final modifiers ---
    const finalModifiers: number[] = [];
    const screenMod = screenModifier(screens, isPhysical, isDoubles, { isCrit });
    if (screenMod !== M.NEUTRAL) finalModifiers.push(screenMod);
    if (attacker.item === "life-orb") finalModifiers.push(M.LIFE_ORB);
    if (attacker.item === "metronome" && typeof attacker.itemConditions.metronome === "number") {
      const turns = attacker.itemConditions.metronome;
      if (turns === 1) finalModifiers.push(M.METRONOME_1);
      else if (turns === 2) finalModifiers.push(M.METRONOME_2);
      else if (turns === 3) finalModifiers.push(M.METRONOME_3);
      else if (turns === 4) finalModifiers.push(M.METRONOME_4);
      else if (turns >= 5) finalModifiers.push(M.METRONOME_5);
    }

    // --- Other modifiers ---
    const isSpreadMove =
      isDoubles && (move.range === "all-opponents" || move.range === "all-pokemon");
    const stab = stabModifier(atkPokemon.types, moveType);
    const weatherMod = weatherModifier(weather, moveType);
    const spreadMod = spreadModifier(isSpreadMove);

    // Burn halves physical damage, EXCEPT for Facade.
    const isBurned = (ac.burn ?? false) && move.identifier !== "facade";

    // --- Type-effectiveness override (Freeze-Dry / Tar Shot) ---
    const defType1 = defPokemon.types[0];
    const defType2 = defPokemon.types[1] ?? null;
    let effectivenessOverride: number | null = null;
    if (mechanics.freezeDry && moveType === "ice") {
      effectivenessOverride = freezeDryOverride(defType1, defType2);
    } else if (dc.tarShot && moveType === "fire") {
      effectivenessOverride = tarShotFireOverride(defType1, defType2);
    }

    // --- Immunity override (Levitate / Gravity vs Ground) ---
    let immuneOverride: boolean | null = null;
    if (moveType === "ground") {
      if (gravity) {
        immuneOverride = false; // Forces hit against Flying / Levitate
      } else if (defender.ability === "levitate") {
        immuneOverride = true; // Blocked by Levitate
      }
    }

    // --- Protect ---
    // Piercing Drill / Unseen Fist pierce Protect with CONTACT moves for 1/4
    // damage (Champions). Any other case behind Protect is fully blocked.
    let protectModifier: number | undefined;
    if (dc.protect) {
      const isContact = move.classifications.includes("contact");
      const canPierce =
        isContact && (attacker.ability === "unseen-fist" || attacker.ability === "piercing-drill");
      if (canPierce) {
        protectModifier = M.Z_INTO_PROTECT; // 1024 = 0.25x
      } else {
        immuneOverride = true; // fully blocked
      }
    }

    return {
      level: 50,
      basePower,
      bpModifiers: bpModifiers.length > 0 ? bpModifiers : undefined,
      attack: atkStat,
      attackBoost,
      attackModifiers: attackModifiers.length > 0 ? attackModifiers : undefined,
      defense: defStat,
      defenseBoost,
      defenseModifiers: defenseModifiers.length > 0 ? defenseModifiers : undefined,
      isPhysical,
      moveType,
      defenderType1: defType1,
      defenderType2: defType2,
      effectivenessOverride,
      immuneOverride,
      spreadModifier: spreadMod,
      weatherModifier: weatherMod,
      isCrit,
      critModifier: M.CRIT,
      stabModifier: stab,
      finalModifiers: finalModifiers.length > 0 ? finalModifiers : undefined,
      protectModifier,
      isBurned,
    };
  }, [
    attacker,
    defender,
    weather,
    terrain,
    fairyAura,
    wonderRoom,
    gravity,
    screens,
    isDoubles,
    isCrit,
  ]);

  const defenderMaxHp = useMemo(() => {
    if (!defender.identifier) return undefined;
    const defPokemon = championsPokemonByIdentifier.get(defender.identifier);
    if (!defPokemon) return undefined;
    return calcHp(defPokemon.status[0], defender.evHp);
  }, [defender.identifier, defender.evHp]);

  const missingReason = useMemo((): DamageCalcResult["missingReason"] => {
    if (damageInput !== null) return null;
    if (!attacker.identifier) return "attacker";
    if (!attacker.move) return "move";
    if (!defender.identifier) return "defender";
    return null;
  }, [damageInput, attacker.identifier, attacker.move, defender.identifier]);

  // hitCount for the currently selected move (used by ResultPanel).
  const activeMoveHitCount = useMemo(() => {
    if (!attacker.move) return undefined;
    const move = moveByIdentifier.get(attacker.move);
    if (!move || move.category === "status") return undefined;
    return getMoveMechanics(move.identifier, move.category).hitCount;
  }, [attacker.move]);

  const activeMoveHitCountAlreadyMerged = useMemo(() => {
    if (!attacker.move) return false;
    const move = moveByIdentifier.get(attacker.move);
    if (!move || move.category === "status") return false;
    return getMoveMechanics(move.identifier, move.category).hitCountAlreadyMerged ?? false;
  }, [attacker.move]);

  const { output, analysis, isLoading, isError } = useDamageCalc(
    damageInput,
    defenderMaxHp,
    damageInput !== null,
  );

  const result: DamageCalcResult = {
    output,
    analysis,
    isLoading,
    isError,
    error: null,
    missingReason,
    hitCount: activeMoveHitCount,
    hitCountAlreadyMerged: activeMoveHitCountAlreadyMerged,
  };

  return {
    attacker,
    defender,
    setAttacker,
    setDefender,
    weather,
    setWeather,
    terrain,
    setTerrain,
    fairyAura,
    setFairyAura,
    wonderRoom,
    setWonderRoom,
    gravity,
    setGravity,
    screens,
    setScreens,
    isDoubles,
    setIsDoubles,
    isCrit,
    setIsCrit,
    critDisabled,
    result,
  };
}
