import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: defog", () => {
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
          species: "pidgeot",
          hp: 1000,
          maxhp: 1000,
          speed: 300,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "keeneye",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "pikachu",
          hp: 1000,
          maxhp: 1000,
          speed: 200,
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
      aurora_veil_turns: 2,
    },
    p2: {
      active: [
        {
          ident: "p2a",
          species: "raichu",
          hp: 1000,
          maxhp: 1000,
          speed: 250,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
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
      aurora_veil_turns: 3,
    },
    weather: undefined,
    weather_turns_left: 0,
    terrain: "electric",
    terrain_turns_left: 2,
    trick_room: false,
  });

  engine.start_battle();

  const logs1 = engine.run_turn({
    p1a: "defog",
    p1a_target: 0,
    p1b: "defog",
    p1b_target: 1,
    p2a: "tackle",
    p2a_target: 1,
    p2b: "tackle",
    p2b_target: 1,
  });

  const events1 = logs1.events.map((e) => e.event);

  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "defog",
        attacker: { player: 1, slot: 0 },
      }),
      expect.objectContaining({
        type: "StatChange",
        target: { player: 2, slot: 0 },
        stat: "evasion",
        amount: -1,
      }),
      expect.objectContaining({
        type: "TerrainChange",
        terrain: "Electric Terrain",
        is_start: false,
      }),
      expect.objectContaining({ type: "SideEnd", player: 2, effect: "Aurora Veil" }),
    ]),
  );

  // Evasion is lowered and terrain is cleared, let check second defog
  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "defog",
        attacker: { player: 1, slot: 1 },
      }),
      expect.objectContaining({
        type: "StatChange",
        target: { player: 2, slot: 1 },
        stat: "evasion",
        amount: -1,
      }),
    ]),
  );
});
