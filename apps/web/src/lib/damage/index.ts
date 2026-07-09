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
} from "./modifiers";
export type { Weather, Terrain, ScreenState } from "./modifiers";
export { analyze } from "./analysis";
export type { DamageAnalysis } from "./analysis";
export {
  getMoveMechanics,
  resolveFieldReactiveMove,
  VARIABLE_POWER_MOVES,
} from "./moveMechanics";
export type { MoveMechanics, MoveConditionDef, PowerContext, StatKey } from "./moveMechanics";
