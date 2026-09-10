import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: Steel Roller", () => {
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
          species: "forretress",
          type1: "Bug",
          type2: "Steel",
          hp: 100,
          maxhp: 100,
          speed: 300,
          attack: 100,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "sturdy",
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
          species: "blastoise",
          type1: "Water",
          hp: 100,
          maxhp: 100,
          speed: 250,
          attack: 10,
          defense: 50,
          sp_attack: 10,
          sp_defense: 50,
          item: undefined,
          ability: "torrent",
          status: undefined,
        },
        {
          ident: "p2b",
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
      ],
      team: [],
      tailwind: false,
      tailwind_turns: 0,
      aurora_veil_turns: 0,
    },
    weather: undefined,
    weather_turns_left: 0,
    terrain: "electric",
    terrain_turns_left: 5,
    trick_room: false,
  });

  engine.start_battle();
  const logs = engine.run_turn({
    p1a: "steelroller",
    p1a_target: 0,
    p2a: "tackle",
    p2a_target: 0,
    p1b: "tackle",
    p1b_target: 0,
    p2b: "tackle",
    p2b_target: 0,
  });

  const state = engine.get_state();
  expect(state.terrain).toBeUndefined();
  expect(state.p2.active[0].hp).toBeLessThan(100);

  const events = logs.events.map((e) => e.event);
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "steelroller",
        attacker: { player: 1, slot: 0 },
      }),
      expect.objectContaining({
        type: "TerrainChange",
        terrain: "Electric Terrain",
        is_start: false,
      }),
    ]),
  );
});
