import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: encore", () => {
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
          type1: "ghost",
          type2: "poison",
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
          type1: "Electric",
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

  // Turn 1: Raichu uses tackle. Gengar (faster) uses Encore, which fails because Raichu has no last move.
  const logs1 = engine.run_turn({
    p1a: "encore",
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
        move_id: "encore",
        attacker: { player: 1, slot: 0 },
      }),
      expect.objectContaining({ type: "Fail", target: { player: 2, slot: 0 } }),
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "tackle",
        attacker: { player: 2, slot: 0 },
      }),
    ]),
  );

  // Turn 2: Gengar uses Encore. Raichu tries to use thunderbolt, but is forced to use tackle!
  const logs2 = engine.run_turn({
    p1a: "encore",
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
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "encore",
        attacker: { player: 1, slot: 0 },
      }),
      expect.objectContaining({ type: "Start", target: { player: 2, slot: 0 }, effect: "encore" }),
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "tackle",
        attacker: { player: 2, slot: 0 },
      }), // IT USED TACKLE, NOT THUNDERBOLT!
    ]),
  );
  expect(events2).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "thunderbolt",
        attacker: { player: 2, slot: 0 },
      }),
    ]),
  );
});
