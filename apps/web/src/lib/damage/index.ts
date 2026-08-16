export { calculate, preloadDamageEngine } from "./engine";
export { M } from "./types";
export type { DamageInput, DamageOutput } from "./types";
export { isPhysicalCategory } from "./types";
export {
  weatherModifier,
  stabModifier,
  screenModifier,
  spreadModifier,
  terrainModifier,
  terrainDefensiveModifier,
} from "./modifiers";
export type { Weather, Terrain, ScreenState } from "./modifiers";
export { analyze } from "./analysis";
export type { DamageAnalysis } from "./analysis";
export {
  getMoveMechanics,
  resolveFieldReactiveMove,
  resolveAbilityTypeChange,
  VARIABLE_POWER_MOVES,
} from "./moveMechanics";
export { isImmune, effectivenessShift, freezeDryOverride, tarShotFireOverride } from "./typeChart";
export type { MoveMechanics, MoveConditionDef, PowerContext, StatKey } from "./moveMechanics";
export { resolveDamageInput, isGrounded } from "./resolve";
export type { PokemonPanelState, ResolveContext } from "./resolve";
