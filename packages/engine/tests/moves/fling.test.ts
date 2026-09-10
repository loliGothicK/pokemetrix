import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: fling", () => {
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
          item: "light-ball",
          ability: "innerfocus",
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
    p1a: "fling",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "tackle",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 0,
  });

  const events = logs.events.map((e) => e.event);

  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "fling",
        attacker: { player: 1, slot: 0 },
      }),
      expect.objectContaining({
        type: "Text",
        message: "|-enditem|p1a|light-ball|[from] move: Fling",
      }),
      expect.objectContaining({ type: "Damage", target: { player: 2, slot: 0 } }),
      expect.objectContaining({
        type: "StatusInflicted",
        target: { player: 2, slot: 0 },
        status: "par",
      }),
    ]),
  );
});
