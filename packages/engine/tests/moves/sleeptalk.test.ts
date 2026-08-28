import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: sleeptalk (sleeping pokemon uses sleeptalk)", () => {
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
          species: "snorlax",
          hp: 500,
          maxhp: 500,
          speed: 100,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          ability: "gluttony",
          status: "slp",
        },
        {
          ident: "p1b",
          species: "clefable",
          hp: 300,
          maxhp: 300,
          speed: 80,
          attack: 80,
          defense: 80,
          sp_attack: 80,
          sp_defense: 80,
          ability: "magicguard",
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
          species: "tauros",
          hp: 300,
          maxhp: 300,
          speed: 150,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          item: undefined,
          ability: "intimidate",
          status: undefined,
        },
        {
          ident: "p2b",
          species: "raichu",
          hp: 200,
          maxhp: 200,
          speed: 120,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          item: undefined,
          ability: "static",
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

  const logs = engine.run_turn({
    p1a: "sleeptalk",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 0,
    p2a: "tackle",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 1,
  });

  const events = logs.events.map((e) => e.event);
  // sleeptalk should be used (even if it randomly calls a sub-move)
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "sleeptalk",
        attacker: { player: 1, slot: 0 },
      }),
    ]),
  );
});
