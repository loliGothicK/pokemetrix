import { describe, expect, it } from "vitest";
import { run_turn, FullBattleState } from "../pkg-node/engine";

describe("Engine Error Handling", () => {
  it("throws an error when a move does not exist in the metagame data", () => {
    const actions = {
      p1a: "invalidmove",
      p1a_target: 0,
      p1b: "sleeptalk",
      p1b_target: 0,
      p2a: "sleeptalk",
      p2a_target: 0,
      p2b: "sleeptalk",
      p2b_target: 0,
    };

    const state: FullBattleState = {
      p1: [
        {
          ident: "p1a",
          hp: 100,
          maxhp: 100,
          speed: 10,
          attack: 10,
          sp_attack: 10,
          defense: 10,
          sp_defense: 10,
          type1: "Normal",
          type2: "",
          ability: "runaway",
          item: "",
          status: "",
          volatile_status: [],
          boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 },
          added_type: "",
        },
      ],
      p2: [],
      weather: "",
      weather_turns_left: 0,
      terrain: "",
      terrain_turns_left: 0,
      trick_room: false,
      p1_tailwind: false,
      p2_tailwind: false,
    };

    expect(() => run_turn(state, actions, null)).toThrow("Move not found in database: invalidmove");
  });
});
