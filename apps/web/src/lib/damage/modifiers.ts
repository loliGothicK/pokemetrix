import type { Type } from "@/types/pokemon";
import { M } from "./types";

/** Weather states relevant to damage. */
export type Weather = "none" | "sun" | "rain" | "harsh-sun" | "heavy-rain";

/**
 * Weather modifier for a move of the given type.
 * Sun boosts Fire / weakens Water; Rain boosts Water / weakens Fire.
 */
export function weatherModifier(weather: Weather, moveType: Type): number {
  const sunny = weather === "sun" || weather === "harsh-sun";
  const rainy = weather === "rain" || weather === "heavy-rain";
  if (sunny) {
    if (moveType === "fire") return M.WEATHER_BOOST;
    if (moveType === "water") return M.WEATHER_PENALTY;
  }
  if (rainy) {
    if (moveType === "water") return M.WEATHER_BOOST;
    if (moveType === "fire") return M.WEATHER_PENALTY;
  }
  return M.NEUTRAL;
}

/** STAB modifier: 1.5x normally, 2x with Adaptability, 1x if not matching. */
export function stabModifier(
  attackerTypes: readonly Type[],
  moveType: Type,
  adaptability = false,
): number {
  if (!attackerTypes.includes(moveType)) return M.NEUTRAL;
  return adaptability ? M.STAB_ADAPTABILITY : M.STAB;
}

/** Which screen (if any) protects against the move's category. */
export type ScreenState = {
  reflect?: boolean; // physical
  lightScreen?: boolean; // special
  auroraVeil?: boolean; // both
};

/**
 * Screen final-modifier. Returns 4096 (no-op) when no relevant screen is up,
 * when it is a critical hit, or when the attacker has Infiltrator.
 */
export function screenModifier(
  screens: ScreenState,
  isPhysical: boolean,
  isDoubles: boolean,
  opts: { isCrit?: boolean; infiltrator?: boolean } = {},
): number {
  if (opts.isCrit || opts.infiltrator) return M.NEUTRAL;
  const relevant = screens.auroraVeil || (isPhysical ? screens.reflect : screens.lightScreen);
  if (!relevant) return M.NEUTRAL;
  return isDoubles ? M.SCREEN_DOUBLES : M.SCREEN_SINGLES;
}

/** Spread modifier for a multi-target move. */
export function spreadModifier(hitsMultipleTargets: boolean, isBattleRoyal = false): number {
  if (!hitsMultipleTargets) return M.NEUTRAL;
  return isBattleRoyal ? M.SPREAD_ROYAL : M.SPREAD;
}
