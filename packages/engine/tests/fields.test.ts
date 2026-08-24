import { describe, it, expect } from "vitest";
import * as engine from "../pkg-node/engine.js";

function makeMon(ident: string, ty1: string, item: string, ability: string) {
  return {
    ident,
    hp: 160,
    maxhp: 160,
    speed: 100,
    attack: 100,
    defense: 100,
    sp_attack: 100,
    sp_defense: 100,
    item: item || "",
    ability: ability || "none",
    status: "",
    type1: ty1,
    type2: "",
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    volatile_status: [],
  };
}

describe("Field Effects (Weather & Terrain)", () => {
  it("should apply Sandstorm damage to non-Rock/Ground/Steel and not to immune types", () => {
    const initialState = {
      weather: "Sandstorm",
      terrain: "",
      trick_room: false,
      p1_tailwind: false,
      p2_tailwind: false,
      p1: [
        makeMon("p1a", "Fire", "", ""), // Should take damage
        makeMon("p1b", "Rock", "", ""), // Immune
      ],
      p2: [
        makeMon("p2a", "Ground", "", ""), // Immune
        makeMon("p2b", "Steel", "", ""), // Immune
      ],
    };

    const actions = {
      p1a: "yawn",
      p1a_target: 0,
      p1b: "yawn",
      p1b_target: 0,
      p2a: "yawn",
      p2a_target: 0,
      p2b: "yawn",
      p2b_target: 0,
    };

    const result = engine.run_turn(initialState, actions, {
      damage_roll: "min",
      crits: "never",
      accuracy: "always",
    });

    // 160 / 16 = 10 damage
    expect(result.p1[0].hp).toBe(150);
    expect(result.p1[1].hp).toBe(160);
    expect(result.p2[0].hp).toBe(160);
    expect(result.p2[1].hp).toBe(160);
  });

  it("should apply Grassy Terrain healing to grounded Pokémon", () => {
    const initialState = {
      weather: "",
      terrain: "GrassyTerrain",
      trick_room: false,
      p1_tailwind: false,
      p2_tailwind: false,
      p1: [
        makeMon("p1a", "Grass", "", ""), // Grounded, heals
        makeMon("p1b", "Flying", "", ""), // Not grounded
      ],
      p2: [
        makeMon("p2a", "Water", "", "levitate"), // Not grounded
        makeMon("p2b", "Flying", "", ""), // Not grounded
      ],
    };

    // Damage everyone by 20 to see who heals
    initialState.p1[0].hp = 140;
    initialState.p1[1].hp = 140;
    initialState.p2[0].hp = 140;
    initialState.p2[1].hp = 140;

    const actions = {
      p1a: "yawn",
      p1a_target: 0,
      p1b: "yawn",
      p1b_target: 0,
      p2a: "yawn",
      p2a_target: 0,
      p2b: "yawn",
      p2b_target: 0,
    };

    const result = engine.run_turn(initialState, actions, {
      damage_roll: "min",
      crits: "never",
      accuracy: "always",
    });

    // Heals 1/16 of max (160) = 10
    expect(result.p1[0].hp).toBe(150);
    expect(result.p1[1].hp).toBe(140); // Flying
    expect(result.p2[0].hp).toBe(140); // Levitate
    expect(result.p2[1].hp).toBe(140); // Air Balloon
  });
});
