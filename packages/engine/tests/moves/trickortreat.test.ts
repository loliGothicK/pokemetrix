import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: Trick-or-Treat", () => {
  const engine = new Simulator({
    damage_roll: "max",
    crits: "never",
    accuracy: "always",
    secondary: "never",
  });

  engine.set_state({
    p1: {
      active: [
        {
          ident: "p1a",
          species: "gourgeist-average",
          type1: "Ghost",
          type2: "Grass",
          hp: 100,
          maxhp: 100,
          speed: 300,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "pickup",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "charizard",
          type1: "Fire",
          type2: "Flying",
          hp: 100,
          maxhp: 100,
          speed: 200,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "blaze",
          status: undefined,
        },
      ],
      team: [],
      tailwind: false,
      tailwind_turns: 0,
      aurora_veil_turns: 0,
    },
    p2: {
      active: [
        {
          ident: "p2a",
          species: "snorlax",
          type1: "Normal",
          hp: 100,
          maxhp: 100,
          speed: 50,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "immunity",
          status: undefined,
        },
        {
          ident: "p2b",
          species: "blastoise",
          type1: "Water",
          hp: 100,
          maxhp: 100,
          speed: 150,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "torrent",
          status: undefined,
        },
      ],
      team: [],
      tailwind: false,
      tailwind_turns: 0,
      aurora_veil_turns: 0,
    },
    weather: undefined,
    weather_turns_left: 0,
    terrain: undefined,
    terrain_turns_left: 0,
    trick_room: false,
  });

  engine.start_battle();
  engine.run_turn({
    p1a: "trickortreat",
    p1a_target: 0,
    p2a: "tackle",
    p2a_target: 0,
    p1b: "tackle",
    p1b_target: 0,
    p2b: "tackle",
    p2b_target: 0,
  });

  const state = engine.get_state();
  expect(state.p2.active[0].added_type).toBe("Ghost");
});
