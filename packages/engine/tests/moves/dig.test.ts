import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: dig", () => {
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
          speed: 300,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
          item: undefined,
          ability: "thickfat",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "gengar",
          hp: 100,
          maxhp: 100,
          speed: 200,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "cursedbody",
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
          speed: 250,
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
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
          attack: 100,
          defense: 100,
          sp_attack: 100,
          sp_defense: 100,
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
    p1a: "dig",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 0,
    p2a: "thunderbolt",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 1,
  });

  const events1 = logs1.events.map((e) => e.event);

  // Turn 1: Snorlax digs, misses Thunderbolt
  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "dig",
        attacker: { player: 1, slot: 0 },
      }),
      expect.objectContaining({ type: "Prepare", target: { player: 1, slot: 0 }, move_id: "dig" }),
      // Raichu misses Thunderbolt because Snorlax is underground
      expect.objectContaining({
        type: "Miss",
        attacker: { player: 2, slot: 0 },
        target: { player: 1, slot: 0 },
      }),
    ]),
  );

  const logs2 = engine.run_turn({
    p1a: "dig",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 0,
    p2a: "thunderbolt",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 1,
  });

  const events2 = logs2.events.map((e) => e.event);

  // Turn 2: Dugtrio hits Dig
  expect(events2).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "dig",
        attacker: { player: 1, slot: 0 },
      }),
      expect.objectContaining({ type: "Damage", target: { player: 2, slot: 0 } }),
    ]),
  );
});
