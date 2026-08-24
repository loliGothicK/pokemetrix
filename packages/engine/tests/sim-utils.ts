import { Battle, Dex, PokemonSet, StatsTable, Move } from "@pkmn/sim";

import * as champions from "@pkmn/mods/champions";

Dex.mod("champions", champions);

export type DeterministicMoveOptions =
  | string
  | {
      id: string;
      accuracy?: true | number | "inherit";
      secondary?: Move["secondary"] | "inherit";
    };

/**
 * Forces the specified moves to always hit and never trigger secondary effects
 * for the duration of the test to avoid PRNG-related test flakes.
 * You can also pass an object to explicitly override accuracy or secondary effects if you want to test them.
 */
export function withDeterministicMoves(
  battle: Battle,
  moves: (string | DeterministicMoveOptions)[],
  fn: () => void,
) {
  const originals: { move: Move; accuracy: Move["accuracy"]; secondary: Move["secondary"] }[] = [];
  try {
    for (const config of moves) {
      const id = typeof config === "string" ? config : config.id;
      const move = battle.dex.moves.get(id);
      if (!move) continue;
      originals.push({ move, accuracy: move.accuracy, secondary: move.secondary });

      const configAccuracy = typeof config === "string" ? true : (config.accuracy ?? true);
      const configSecondary = typeof config === "string" ? null : (config.secondary ?? null);

      const forceAccuracy = configAccuracy === "inherit" ? move.accuracy : configAccuracy;
      const forceSecondary = configSecondary === "inherit" ? move.secondary : configSecondary;

      Object.defineProperty(move, "accuracy", { value: forceAccuracy, configurable: true });
      Object.defineProperty(move, "secondary", { value: forceSecondary, configurable: true });
    }
    fn();
  } finally {
    for (const { move, accuracy, secondary } of originals) {
      Object.defineProperty(move, "accuracy", { value: accuracy, configurable: true });
      Object.defineProperty(move, "secondary", { value: secondary, configurable: true });
    }
  }
}

import type { PokemonData, FullBattleState } from "../pkg-node/engine.js";

export function pkmn(
  opts: Omit<Partial<PokemonSet>, "evs"> & { evs?: Partial<StatsTable> },
): PokemonSet {
  const evs = opts.evs || {};
  return {
    name: opts.species || "Unknown",
    species: opts.species || "Unknown",
    item: opts.item ?? "",
    ability: opts.ability ?? "illuminate",
    moves: opts.moves ?? [],
    nature: opts.nature ?? "Hardy",
    gender: opts.gender ?? "N",
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    level: opts.level ?? 50,
    ...opts,
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...evs },
  };
}

/**
 * Wraps engine's PokemonData (with optional fields) into a strict PokemonSet for @pkmn/sim.
 */
export function toSimPokemonSet(data: PokemonData, moves: string[] = []): PokemonSet {
  return {
    name: data.ident,
    species: data.ident,
    item: data.item ?? "",
    ability: data.ability ?? "illuminate",
    moves,
    nature: "serious",
    gender: "N",
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    level: 50,
  };
}

export function createSimBattle(formatid: string = "gen9doublescustomgame"): Battle {
  const battle = new Battle({ formatid: Dex.toID(formatid) });
  // Overriding mod dynamically allows the tests to use Champions mechanics
  Object.defineProperty(battle.format, "mod", { value: "champions", writable: true });

  // Mock PRNG for deterministic tests
  battle.prng.random = (_m?: number, _n?: number) => {
    // Gen 9 randomizer calls random(16). We want it to return 15 to get 85% min roll.
    // So 16 - 1 = 15.
    return 0;
  };

  battle.prng.randomChance = (numerator: number, denominator: number) => {
    console.log(`randomChance called with ${numerator}/${denominator}`);
    // We force `accuracy: true` in the tests, so randomChance(X, 100) is only for secondary effects.
    // We return false to prevent crits and secondary effects.
    return false;
  };

  return battle;
}

export function buildEngineStateFromSim(battle: Battle): FullBattleState {
  const p1 = battle.p1.active.map((p: NonNullable<Battle["p1"]["active"][0]>, i: number) => ({
    ident: `p1${String.fromCharCode(97 + i)}`,
    hp: p.hp,
    maxhp: p.maxhp,
    speed: p.speed,
    attack: p.storedStats.atk,
    defense: p.storedStats.def,
    sp_attack: p.storedStats.spa,
    sp_defense: p.storedStats.spd,
    item: p.item,
    ability: p.ability,
    status: p.status,
    type1: p.types[0] || "Normal",
    type2: p.types[1] || "",
    added_type: p.addedType || "",
    boosts: {
      atk: p.boosts.atk || 0,
      def: p.boosts.def || 0,
      spa: p.boosts.spa || 0,
      spd: p.boosts.spd || 0,
      spe: p.boosts.spe || 0,
      accuracy: p.boosts.accuracy || 0,
      evasion: p.boosts.evasion || 0,
    },
    volatile_status: Object.keys(p.volatiles),
  }));

  const p2 = battle.p2.active.map((p: NonNullable<Battle["p2"]["active"][0]>, i: number) => ({
    ident: `p2${String.fromCharCode(97 + i)}`,
    hp: p.hp,
    maxhp: p.maxhp,
    speed: p.speed,
    attack: p.storedStats.atk,
    defense: p.storedStats.def,
    sp_attack: p.storedStats.spa,
    sp_defense: p.storedStats.spd,
    item: p.item,
    ability: p.ability,
    status: p.status,
    type1: p.types[0] || "Normal",
    type2: p.types[1] || "",
    added_type: p.addedType || "",
    boosts: {
      atk: p.boosts.atk || 0,
      def: p.boosts.def || 0,
      spa: p.boosts.spa || 0,
      spd: p.boosts.spd || 0,
      spe: p.boosts.spe || 0,
      accuracy: p.boosts.accuracy || 0,
      evasion: p.boosts.evasion || 0,
    },
    volatile_status: Object.keys(p.volatiles),
  }));

  return {
    p1,
    p2,
    weather: battle.field.weather || "",
    terrain: battle.field.terrain || "",
    weather_turns_left: 0,
    terrain_turns_left: 0,
  };
}
