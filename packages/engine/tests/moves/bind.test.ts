import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: bind traps and deals damage", () => {
  const engine = new Simulator({
    damage_roll: "max",
    crits: "never",
    accuracy: "always",
    secondary: "always",
  });

  engine.set_state({
    p1: {
      active: [
        {
          ident: "p1a",
          species: "snorlax",
          hp: 100,
          maxhp: 100,
          speed: 100,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          ability: "gluttony",
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
          species: "raichu",
          hp: 100,
          maxhp: 100,
          speed: 20,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
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

  const logs1 = engine.run_turn({
    p1a: "bind",
    p1a_target: 0,
    p1b: "pass",
    p1b_target: 0,
    p2a: "tackle",
    p2a_target: 0,
    p2b: "pass",
    p2b_target: 0,
  });

  const events1 = logs1.events.map((e) => e.event);

  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "MoveUsed", move_id: "bind" }),
      expect.objectContaining({
        type: "Start",
        target: { player: 2, slot: 0 },
        effect: "partiallytrapped",
      }),
      expect.objectContaining({ type: "Damage", target: { player: 2, slot: 0 } }),
    ]),
  );

  // 1/8 of 100 maxhp = 12 damage at end of turn.
  // Wait, bind base damage + end of turn damage!
});
