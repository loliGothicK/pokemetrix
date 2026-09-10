import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: payback", () => {
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
          species: "snorlax",
          type1: "normal",
          hp: 100,
          maxhp: 100,
          speed: 50,
          attack: 100,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "thickfat",
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
          speed: 10,
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
    p1a: "payback",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "tackle",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 0,
  });

  const events = logs.events.map((e) => e.event);

  // p2a (Raichu, speed 300) moves first
  // p1a (Snorlax, speed 50) moves after p2a
  // Payback hits p2a -> Should be 100 BP!
  const payback1 = events.find(
    (e) =>
      e.type === "Damage" &&
      e.target.player === 2 &&
      e.target.slot === 0 &&
      e.from_effect === undefined &&
      e.damage > 30,
  );
  expect(payback1).toBeDefined();

  const engine2 = new Simulator({
    damage_roll: "max",
    crits: "never",
    accuracy: "always",
    secondary: "never",
  });
  engine2.set_state({
    p1: {
      active: [
        {
          ident: "p1a",
          species: "snorlax",
          type1: "normal",
          hp: 100,
          maxhp: 100,
          speed: 500,
          attack: 100,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "thickfat",
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
          speed: 10,
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

  engine2.start_battle();
  const logs2 = engine2.run_turn({
    p1a: "payback",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "tackle",
    p2a_target: 0,
    p2b: "tackle",
    p2b_target: 0,
  });

  const events2 = logs2.events.map((e) => e.event);

  // p1a (Snorlax, speed 500) moves first
  // p2a (Raichu, speed 300) hasn`t moved yet
  // Payback hits p2a -> Should be 50 BP!
  const payback2 = events2.find(
    (e) =>
      e.type === "Damage" &&
      e.target.player === 2 &&
      e.target.slot === 0 &&
      e.from_effect === undefined,
  );
  // @ts-expect-error test
  expect(payback1!.damage).toBeGreaterThan(payback2!.damage * 1.8);
});
