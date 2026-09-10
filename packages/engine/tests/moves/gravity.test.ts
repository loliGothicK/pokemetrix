import { expect, test } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: gravity", () => {
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
          species: "alakazam",
          type1: "Psychic",
          hp: 100,
          maxhp: 100,
          speed: 200,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "magicguard",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "snorlax",
          type1: "normal",
          hp: 1000,
          maxhp: 1000,
          speed: 10,
          attack: 10,
          defense: 100,
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
      reflect_turns: 0,
      lightscreen_turns: 0,
      safeguard_turns: 0,
    },
    p2: {
      active: [
        {
          ident: "p2a",
          species: "skarmory",
          type1: "steel",
          type2: "Flying",
          hp: 100,
          maxhp: 100,
          speed: 150,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "sturdy",
          status: undefined,
        },
        {
          ident: "p2b",
          species: "rotom",
          type1: "Electric",
          type2: "ghost",
          hp: 100,
          maxhp: 100,
          speed: 100,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
          ability: "levitate",
          status: undefined,
        },
      ],
      team: [],
      tailwind: false,
      tailwind_turns: 0,
      aurora_veil_turns: 0,
      reflect_turns: 0,
      lightscreen_turns: 0,
      safeguard_turns: 0,
    },
    weather: undefined,
    weather_turns_left: 0,
    terrain: undefined,
    terrain_turns_left: 0,
    trick_room: false,
  });
  engine.start_battle();

  let logs = engine.run_turn({
    p1a: "gravity",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "fly",
    p2a_target: 1, // Will fail due to gravity!
    p2b: "tackle",
    p2b_target: 1,
  });

  let events = logs.events.map((e) => e.event);

  // Skarmory fly should fail due to gravity
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "Text", message: "-fieldstart|move: Gravity" }),
      expect.objectContaining({
        type: "Cant",
        target: { player: 2, slot: 0 },
        reason: "gravity",
        move_id: "fly",
      }),
    ]),
  );

  // Turn 2: Earthquake hits Flying and Levitate
  logs = engine.run_turn({
    p1a: "earthquake",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "tackle",
    p2a_target: 1,
    p2b: "tackle",
    p2b_target: 1,
  });
  events = logs.events.map((e) => e.event);

  // Check damage on p2a (Skarmory, Flying) and p2b (Rotom, Levitate)
  const dmgP2A = events.find(
    (e) => e.type === "Damage" && e.target.player === 2 && e.target.slot === 0,
  );
  const dmgP2B = events.find(
    (e) => e.type === "Damage" && e.target.player === 2 && e.target.slot === 1,
  );

  expect(dmgP2A).toBeDefined();
  expect(dmgP2B).toBeDefined();
});
