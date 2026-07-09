import { useMemo, useState } from "react";
import { useDamageCalc, type UseDamageCalcResult } from "@/hooks/useDamageCalc";
import {
  weatherModifier,
  terrainModifier,
  stabModifier,
  screenModifier,
  spreadModifier,
  isPhysicalCategory,
  getMoveMechanics,
  resolveFieldReactiveMove,
  type Weather,
  type Terrain,
  type DamageInput,
  type PowerContext,
  M,
} from "@/lib/damage";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { moveByIdentifier } from "@/data/moves";
import { pokemonById } from "@/data/pokemon";
import { calcHp, calcStatus } from "@/data/utility/training";

export type PokemonPanelState = {
  readonly identifier: string | null;
  readonly move: string | null;
  readonly ability: string | null;
  readonly item: string | null;
  readonly boost: number;
  readonly evHp: number;
  readonly evAtk: number;
  readonly evDef: number;
  readonly evSpa: number;
  readonly evSpd: number;
  readonly evSpe: number;
  /** Current HP as a percentage (0–100). Defaults to 100. */
  readonly hpPercent: number;
  /** Attacker only: whether the attacker is burned. */
  readonly isBurned: boolean;
  /** Attacker only: conditional-power toggles keyed by move-condition id. */
  readonly moveConditions: Readonly<Record<string, boolean>>;
};

export type DamageCalcResult = {
  readonly output: UseDamageCalcResult["output"];
  readonly analysis: UseDamageCalcResult["analysis"];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly missingReason: "attacker" | "move" | "defender" | null;
};

const defaultPanel: PokemonPanelState = {
  identifier: null,
  move: null,
  ability: null,
  item: null,
  boost: 0,
  evHp: 0,
  evAtk: 0,
  evDef: 0,
  evSpa: 0,
  evSpd: 0,
  evSpe: 0,
  hpPercent: 100,
  isBurned: false,
  moveConditions: {},
};

export function useDamageCalcPage() {
  const [attacker, setAttacker] = useState<PokemonPanelState>(defaultPanel);
  const [defender, setDefender] = useState<PokemonPanelState>(defaultPanel);
  const [weather, setWeather] = useState<Weather>("none");
  const [terrain, setTerrain] = useState<Terrain>("none");
  const [screens, setScreens] = useState<{
    reflect: boolean;
    lightScreen: boolean;
    auroraVeil: boolean;
  }>({ reflect: false, lightScreen: false, auroraVeil: false });
  const [isDoubles, setIsDoubles] = useState(false);
  const [isCrit, setIsCrit] = useState(false);

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

    // --- Resolve move type & static base power (weather-ball / terrain-pulse) ---
    let moveType = move.type;
    let staticPower = move.power ?? 0;
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

    // --- Actual stat helpers ---
    const stat = (pokemon: typeof atkPokemon, idx: number, ev: number) =>
      calcStatus(pokemon.status[idx], ev);

    const atkSpe = stat(atkPokemon, 5, attacker.evSpe);
    const defSpe = stat(defPokemon, 5, defender.evSpe);

    // Weight (kg): master data stores it in hectograms.
    const atkWeight = (pokemonById.get(atkPokemon.id)?.weight ?? 0) / 10;
    const defWeight = (pokemonById.get(defPokemon.id)?.weight ?? 0) / 10;

    // --- Effective base power ---
    const powerCtx: PowerContext = {
      basePower: staticPower,
      attackerHpPercent: attacker.hpPercent,
      defenderHpPercent: defender.hpPercent,
      attackerSpe: atkSpe,
      defenderSpe: defSpe,
      attackerWeight: atkWeight,
      defenderWeight: defWeight,
      conditions: attacker.moveConditions,
    };
    const basePower = mechanics.computeBasePower
      ? mechanics.computeBasePower(powerCtx)
      : staticPower;

    if (basePower <= 0) return null;

    // --- Offensive stat resolution ---
    let atkStat: number;
    let attackBoost: number;
    if (mechanics.useTargetAttack) {
      // Foul Play: uses the defender's Attack stat + the defender's attack boost.
      atkStat = stat(defPokemon, 1, defender.evAtk);
      attackBoost = defender.boost;
    } else if (mechanics.offensiveStat === "def") {
      // Body Press: uses the user's Defense stat + the user's defense boost.
      atkStat = stat(atkPokemon, 2, attacker.evDef);
      attackBoost = attacker.boost;
    } else if (mechanics.offensiveStat === "spa") {
      atkStat = stat(atkPokemon, 3, attacker.evSpa);
      attackBoost = attacker.boost;
    } else {
      atkStat = stat(atkPokemon, 1, attacker.evAtk);
      attackBoost = attacker.boost;
    }

    // --- Defensive stat resolution ---
    const defStat =
      mechanics.defensiveStat === "spd"
        ? stat(defPokemon, 4, defender.evSpd)
        : stat(defPokemon, 2, defender.evDef);

    // --- Modifiers ---
    const isSpreadMove =
      isDoubles && (move.range === "all-opponents" || move.range === "all-pokemon");

    const stab = stabModifier(atkPokemon.types, moveType);
    const weatherMod = weatherModifier(weather, moveType);
    const terrainMod = terrainModifier(terrain, moveType);
    const screenMod = screenModifier(screens, isPhysical, isDoubles, { isCrit });
    const spreadMod = spreadModifier(isSpreadMove);

    const bpModifiers: number[] = [];
    if (terrainMod !== M.NEUTRAL) bpModifiers.push(terrainMod);

    const finalModifiers: number[] = [];
    if (screenMod !== M.NEUTRAL) finalModifiers.push(screenMod);
    if (attacker.item === "life-orb") finalModifiers.push(M.LIFE_ORB);

    if (attacker.item === "type-boost") bpModifiers.push(M.TYPE_ITEM);

    const attackModifiers: number[] = [];
    if (attacker.item === "choice-band" && isPhysical) attackModifiers.push(M.CHOICE);
    if (attacker.item === "choice-specs" && !isPhysical) attackModifiers.push(M.CHOICE);
    if (attacker.item === "muscle-band" && isPhysical) attackModifiers.push(4505);
    if (attacker.item === "wise-glasses" && !isPhysical) attackModifiers.push(4505);

    // Burn halves physical damage, EXCEPT for Facade.
    const isBurned = attacker.isBurned && move.identifier !== "facade";

    return {
      level: 50,
      basePower,
      bpModifiers: bpModifiers.length > 0 ? bpModifiers : undefined,
      attack: atkStat,
      attackBoost,
      attackModifiers: attackModifiers.length > 0 ? attackModifiers : undefined,
      defense: defStat,
      defenseBoost: defender.boost,
      isPhysical,
      moveType,
      defenderType1: defPokemon.types[0],
      defenderType2: defPokemon.types[1] ?? null,
      spreadModifier: spreadMod,
      weatherModifier: weatherMod,
      isCrit,
      critModifier: M.CRIT,
      stabModifier: stab,
      finalModifiers: finalModifiers.length > 0 ? finalModifiers : undefined,
      isBurned,
    };
  }, [attacker, defender, weather, terrain, screens, isDoubles, isCrit]);

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
    screens,
    setScreens,
    isDoubles,
    setIsDoubles,
    isCrit,
    setIsCrit,
    result,
  };
}
