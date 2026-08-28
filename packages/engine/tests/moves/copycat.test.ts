import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: copycat", () => {
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
          speed: 300,
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

  const logs1 = engine.run_turn({
    p1a: "copycat",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1, // Pikachu tackles Venusaur
    p2a: "tackle",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 0,
  });

  const events1 = logs1.events.map((e) => e.event);

  // Snorlax is the slowest. Venusaur moved right before Snorlax.
  // Venusaur used tackle on p1a (Snorlax).
  // Snorlax uses Copycat -> it copies Tackle.
  // It targets an opponent (e.g. p2a Raichu since p2a is alive, or p2b).
  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "copycat",
        attacker: { player: 1, slot: 0 },
      }),
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "tackle",
        attacker: { player: 1, slot: 0 },
        from_move: "copycat",
      }),
      expect.objectContaining({ type: "Damage", target: { player: 2, slot: 0 } }), // Because Snorlax targets p2a Raichu by default
    ]),
  );
});
