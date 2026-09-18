import { useMemo, useState } from "react";
import { useDamageCalc, type UseDamageCalcResult } from "@/hooks/useDamageCalc";
import {
  getMoveMechanics,
  resolveDamageInput,
  type Weather,
  type Terrain,
  type DamageInput,
  type PokemonPanelState,
} from "@/lib/damage";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { moveByIdentifier } from "@/data/moves";
import { calcHp } from "@/data/utility/training";

export type { PokemonPanelState };

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
  const [isCritState, setIsCritState] = useState(false);
  const critDisabledByAbility =
    defender.ability === "shell-armor" || defender.ability === "battle-armor";

  const isAlwaysCrit = useMemo(() => {
    if (!attacker.move) return false;
    const move = moveByIdentifier.get(attacker.move);
    if (!move || move.category === "status") return false;
    return getMoveMechanics(move.identifier, move.category).alwaysCrit ?? false;
  }, [attacker.move]);

  const effectiveCrit = critDisabledByAbility ? false : isCritState || isAlwaysCrit;
  const effectiveCritDisabled = critDisabledByAbility || isAlwaysCrit;

  const damageInput = useMemo((): DamageInput | null => {
    return resolveDamageInput({
      attacker,
      defender,
      weather,
      terrain,
      fairyAura,
      wonderRoom,
      gravity,
      screens,
      isDoubles,
      isCrit: effectiveCrit,
    });
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
    effectiveCrit,
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
    isCrit: effectiveCrit,
    setIsCrit: setIsCritState,
    critDisabled: effectiveCritDisabled,
    result,
  };
}
