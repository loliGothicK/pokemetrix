import { describe, it, expect } from "vitest";
import * as engine from "../pkg-node/engine.js";

describe("Champions Engine Simulation", () => {
  it("should simulate Black Belt modifying attack damage in a Doubles match", () => {
    const initialState = {
      weather: "",
      terrain: "",
      p1: [
        {
          ident: "p1a",
          hp: 200,
          maxhp: 200,
          speed: 100,
          attack: 150,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          item: "blackbelt",
          ability: "none",
          status: "",
          type1: "Fighting",
          type2: "",
        },
        {
          ident: "p1b",
          hp: 200,
          maxhp: 200,
          speed: 100,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          item: "",
          ability: "none",
          status: "",
          type1: "Normal",
          type2: "",
        },
      ],
      p2: [
        {
          ident: "p2a",
          hp: 300,
          maxhp: 300,
          speed: 90,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          item: "",
          ability: "none",
          status: "",
          type1: "Normal",
          type2: "",
        },
        {
          ident: "p2b",
          hp: 300,
          maxhp: 300,
          speed: 90,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          item: "",
          ability: "none",
          status: "",
          type1: "Normal",
          type2: "",
        },
      ],
    };

    const actions = {
      p1a: "brickbreak",
      p1a_target: 0,
      p1b: "switch",
      p1b_target: 0,
      p2a: "switch",
      p2a_target: 0,
      p2b: "switch",
      p2b_target: 0,
    };

    const result = engine.run_turn(initialState, actions, {
      damage_roll: "max",
      crits: "never",
      accuracy: "always",
    });

    expect(result.p2[0].hp).toBeLessThan(300);
  });
});
