import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: reflect", () => {
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
          speed: 250,
          attack: 100,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: "light-clay",
          ability: "synchronize",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "snorlax",
          type1: "normal",
          hp: 1000,
          maxhp: 1000,
          speed: 200,
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
    },
    p2: {
      active: [
        {
          ident: "p2a",
          species: "raichu",
          type1: "Electric",
          hp: 100,
          maxhp: 100,
          speed: 30,
          attack: 1000,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          // physical
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
          attack: 1000,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          // special
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
    },
    weather: undefined,
    weather_turns_left: 0,
    terrain: undefined,
    terrain_turns_left: 0,
    trick_room: false,
  });

  engine.start_battle();
  const logs = engine.run_turn({
    p1a: "reflect",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "tackle",
    p2a_target: 1, // hits p1b (physical)
    p2b: "thunderbolt",
    p2b_target: 1, // hits p1b (special)
  });

  const events = logs.events.map((e) => e.event);

  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "SideStart", player: 1, effect: "Reflect" }),
    ]),
  );

  const dmgPhysical = events.find(
    (e) =>
      e.type === "Damage" &&
      e.target.slot === 1 &&
      e.target.player === 1 &&
      // @ts-expect-error test
      events[events.indexOf(e) - 1].move_id === "tackle",
  );
  const dmgSpecial = events.find(
    (e) =>
      e.type === "Damage" &&
      e.target.slot === 1 &&
      e.target.player === 1 &&
      // @ts-expect-error test
      events[events.indexOf(e) - 1].move_id === "thunderbolt",
  );

  expect(dmgPhysical).toBeDefined();
  expect(dmgSpecial).toBeDefined();

  // Test that turns is 8 because of Light Clay!
  const finalState = engine.get_state();
  expect(finalState.p1.reflect_turns).toBe(8);
  expect(finalState.p1.lightscreen_turns).toBe(0);
});
