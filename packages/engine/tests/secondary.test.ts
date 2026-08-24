import { describe, it, expect } from "vitest";
import engine, { PokemonData, FullBattleState } from "../pkg-node/engine.js";

// Helper for type-safe mocked PokemonSet properties without @pkmn/sim dependency coupling.
function pkmn(opts: Partial<PokemonData> & { species: string }): PokemonData {
  return {
    ident: opts.species || "Unknown",
    item: opts.item || "",
    ability: opts.ability || "illuminate",
    status: opts.status || "",
    type1: opts.type1 || "Normal",
    type2: opts.type2 || "",
    attack: opts.attack || 100,
    defense: opts.defense || 100,
    sp_attack: opts.sp_attack || 100,
    sp_defense: opts.sp_defense || 100,
    speed: opts.speed || 100,
    hp: opts.hp || 100,
    maxhp: opts.maxhp || 100,
  };
}

describe("Engine Secondary Effects", () => {
  it("should apply flinch from rockslide when secondary is 'always'", () => {
    const initialState: FullBattleState = {
      p1: [
        pkmn({
          species: "Tyranitar",
          attack: 150,
          sp_attack: 100,
          speed: 100,
          maxhp: 500,
          hp: 500,
          type1: "Rock",
          type2: "Dark",
        }),
        pkmn({ species: "Pikachu", hp: 100, maxhp: 100, speed: 10 }),
      ],
      p2: [
        pkmn({
          species: "Charizard",
          attack: 100,
          sp_attack: 100,
          speed: 50,
          maxhp: 500,
          hp: 500,
          type1: "Fire",
          type2: "Flying",
        }),
        pkmn({ species: "Pikachu", hp: 100, maxhp: 100, speed: 10 }),
      ],
    };

    const actions = {
      p1a: "rockslide",
      p1a_target: 0, // Target Charizard
      p1b: "swordsdance",
      p1b_target: 1,
      p2a: "rockslide", // Charizard uses rockslide
      p2a_target: 0,
      p2b: "swordsdance",
      p2b_target: 1,
    };

    const resultState = engine.run_turn(initialState, actions, {
      damage_roll: "max",
      crits: "never",
      accuracy: "always",
      secondary: "always",
    });

    // Verify Charizard flinched and didn't attack (p1 took no damage)
    expect(resultState.p1[0].hp).toBe(500);
  });

  it("should apply burn from flamethrower when secondary is 'always'", () => {
    const initialState: FullBattleState = {
      p1: [
        pkmn({
          species: "Charizard",
          sp_attack: 150,
          speed: 100,
          maxhp: 500,
          hp: 500,
          type1: "Fire",
          type2: "Flying",
        }),
        pkmn({ species: "Pikachu", hp: 100, maxhp: 100, speed: 10 }),
      ],
      p2: [
        pkmn({
          species: "Venusaur",
          sp_defense: 100,
          speed: 50,
          maxhp: 500,
          hp: 500,
          type1: "Grass",
          type2: "Poison",
        }),
        pkmn({ species: "Pikachu", hp: 100, maxhp: 100, speed: 10 }),
      ],
    };

    const actions = {
      p1a: "flamethrower",
      p1a_target: 0, // Target Venusaur
      p1b: "swordsdance",
      p1b_target: 1,
      p2a: "swordsdance",
      p2a_target: 1,
      p2b: "swordsdance",
      p2b_target: 1,
    };

    const resultState = engine.run_turn(initialState, actions, {
      damage_roll: "max",
      crits: "never",
      accuracy: "always",
      secondary: "always",
    });

    // Verify burn was applied
    console.log("Venusaur HP:", resultState.p2[0].hp, "/", resultState.p2[0].maxhp);
    expect(resultState.p2[0].status).toBe("brn");
  });

  it("should apply stat drops from moonblast when secondary is 'always'", () => {
    const initialState: FullBattleState = {
      p1: [
        pkmn({
          species: "Sylveon",
          sp_attack: 150,
          speed: 100,
          maxhp: 500,
          hp: 500,
          type1: "Fairy",
        }),
        pkmn({ species: "Pikachu", hp: 100, maxhp: 100, speed: 10 }),
      ],
      p2: [
        pkmn({
          species: "Machamp",
          sp_defense: 100,
          speed: 50,
          maxhp: 500,
          hp: 500,
          type1: "Fighting",
        }),
        pkmn({ species: "Pikachu", hp: 100, maxhp: 100, speed: 10 }),
      ],
    };

    const actions = {
      p1a: "moonblast",
      p1a_target: 0, // Target Machamp
      p1b: "swordsdance",
      p1b_target: 1,
      p2a: "swordsdance",
      p2a_target: 1,
      p2b: "swordsdance",
      p2b_target: 1,
    };

    const resultState = engine.run_turn(initialState, actions, {
      damage_roll: "max",
      crits: "never",
      accuracy: "always",
      secondary: "always",
    });

    // Verify SpA drop
    console.log("Machamp:", resultState.p2[0]);
    expect(resultState.p2[0].boosts?.spa).toBe(-1);
  });
});
