import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: disable", () => {
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
          species: "gengar",
          hp: 100,
          maxhp: 100,
          speed: 300,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "cursedbody",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "snorlax",
          hp: 100,
          maxhp: 100,
          speed: 200,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "thickfat",
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
      aurora_veil_turns: 0,
    },
    weather: undefined,
    weather_turns_left: 0,
    terrain: undefined,
    terrain_turns_left: 0,
    trick_room: false,
  });

  engine.start_battle();

  // Turn 1: Raichu is faster than Snorlax but slower than Gengar.
  // Wait, Gengar uses Disable on Raichu before Raichu moves. Raichu hasnt used a move yet, so Disable fails!
  const logs1 = engine.run_turn({
    p1a: "disable",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 0,
    p2a: "thunderbolt",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 1,
  });

  const events1 = logs1.events.map((e) => e.event);

  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "MoveUsed", move_id: "disable" }),
      expect.objectContaining({ type: "Fail", target: { player: 2, slot: 0 } }),
    ]),
  );

  // Turn 2: Raichu used thunderbolt in Turn 1! Now Gengar uses Disable again.
  const logs2 = engine.run_turn({
    p1a: "disable",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 0,
    p2a: "thunderbolt",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 1,
  });

  const events2 = logs2.events.map((e) => e.event);

  expect(events2).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "MoveUsed", move_id: "disable" }),
      expect.objectContaining({ type: "Start", target: { player: 2, slot: 0 }, effect: "disable" }),
      expect.objectContaining({
        type: "Cant",
        target: { player: 2, slot: 0 },
        reason: "Disable",
        move_id: "thunderbolt",
      }),
    ]),
  );

  // Also verify Thunderbolt does NOT emit Damage!
  expect(events2).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "Damage", target: { player: 1, slot: 0 } }),
    ]),
  );
});
