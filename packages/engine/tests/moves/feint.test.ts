import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: feint", () => {
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
          species: "raichu",
          type1: "Electric",
          hp: 1000,
          maxhp: 1000,
          speed: 300,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "static",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "snorlax",
          type1: "normal",
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
          species: "lucario",
          type1: "fighting",
          type2: "steel",
          hp: 100,
          maxhp: 100,
          speed: 250,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "innerfocus",
          status: undefined,
        },
        {
          ident: "p2b",
          species: "snorlax",
          type1: "normal",
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
    weather: undefined,
    weather_turns_left: 0,
    terrain: undefined,
    terrain_turns_left: 0,
    trick_room: false,
  });

  engine.start_battle();
  const logs = engine.run_turn({
    p1a: "protect",
    p1a_target: 0,
    p1b: "protect",
    p1b_target: 0,
    p2a: "feint",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 0,
  });

  const events = logs.events.map((e) => e.event);

  // Raichu protects.
  // Lucario uses Feint, which breaks protect (deals damage, text activate).
  // Snorlax uses Tackle, which now succeeds because protect is broken.

  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "protect",
        attacker: { player: 1, slot: 0 },
      }),

      expect.objectContaining({
        type: "MoveUsed",
        move_id: "feint",
        attacker: { player: 2, slot: 0 },
      }),
      expect.objectContaining({ type: "Damage", target: { player: 1, slot: 0 } }),
      expect.objectContaining({ type: "Text", message: "|-activate|p1a|move: Feint" }),

      expect.objectContaining({
        type: "MoveUsed",
        move_id: "tackle",
        attacker: { player: 2, slot: 1 },
      }),
      expect.objectContaining({ type: "Damage", target: { player: 1, slot: 0 } }),
    ]),
  );

  // Assert Tackle did not fail/activate protect!
  expect(events).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "Activate", effect: "move: Protect" }),
    ]),
  );
});
