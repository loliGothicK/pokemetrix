import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: thief", () => {
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
          hp: 1000,
          maxhp: 1000,
          speed: 100,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "gluttony",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "pikachu",
          hp: 100,
          maxhp: 100,
          speed: 100,
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
    p2: {
      active: [
        {
          ident: "p2a",
          species: "raichu",
          hp: 1000,
          maxhp: 1000,
          speed: 200,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: "leftovers",
          ability: "static",
          status: undefined,
        },
        {
          ident: "p2b",
          species: "venusaur",
          hp: 1000,
          maxhp: 1000,
          speed: 150,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "overgrow",
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
    p1a: "thief",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 0,
    p2a: "tackle",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 1,
  });

  const events1 = logs1.events.map((e) => e.event);

  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "thief",
        attacker: { player: 1, slot: 0 },
        target: { player: 2, slot: 0 },
      }),
      expect.objectContaining({
        type: "EndItemSilent",
        target: { player: 2, slot: 0 },
        item: "Leftovers",
        from_move: "Thief",
        of: { player: 1, slot: 0 },
      }),
      expect.objectContaining({
        type: "Item",
        target: { player: 1, slot: 0 },
        item: "Leftovers",
        from_move: "Thief",
        of: { player: 2, slot: 0 },
      }),
    ]),
  );
});
