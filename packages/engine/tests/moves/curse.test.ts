import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: curse", () => {
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
          species: "gengar",
          hp: 1000,
          maxhp: 1000,
          speed: 300,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          type1: "Ghost",
          type2: "Poison",
          item: undefined,
          ability: "levitate",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "snorlax",
          hp: 1000,
          maxhp: 1000,
          speed: 200,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
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

  const logs1 = engine.run_turn({
    p1a: "curse",
    p1a_target: 0, // Targets Raichu (Ghost type targets opponent)
    p1b: "curse",
    p1b_target: 1, // Targets self (Non-ghost)
    p2a: "tackle",
    p2a_target: 1,
    p2b: "tackle",
    p2b_target: 1,
  });

  const events1 = logs1.events.map((e) => e.event);

  // Ghost type (Gengar)
  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "curse",
        attacker: { player: 1, slot: 0 },
        target: { player: 2, slot: 0 },
      }),
      expect.objectContaining({ type: "Start", target: { player: 2, slot: 0 }, effect: "curse" }),
      expect.objectContaining({ type: "Damage", target: { player: 1, slot: 0 }, damage: 500 }), // half max hp
    ]),
  );

  // Non-ghost type (Snorlax)
  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "curse",
        attacker: { player: 1, slot: 1 },
        target: { player: 2, slot: 1 },
      }),
      expect.objectContaining({
        type: "StatChange",
        target: { player: 1, slot: 1 },
        stat: "spe",
        amount: -1,
      }),
      expect.objectContaining({
        type: "StatChange",
        target: { player: 1, slot: 1 },
        stat: "atk",
        amount: 1,
      }),
      expect.objectContaining({
        type: "StatChange",
        target: { player: 1, slot: 1 },
        stat: "def",
        amount: 1,
      }),
    ]),
  );

  // End of turn damage for Raichu
  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "Damage",
        target: { player: 2, slot: 0 },
        damage: 250,
        from_effect: "Curse",
      }),
    ]),
  );
});
