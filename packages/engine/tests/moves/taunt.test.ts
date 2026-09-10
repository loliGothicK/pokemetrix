import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: taunt", () => {
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
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          item: undefined,
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
      safeguard_turns: 0,
    },
    p2: {
      active: [
        {
          ident: "p2a",
          species: "raichu",
          type1: "Electric",
          hp: 100,
          maxhp: 100,
          speed: 100,
          attack: 1000,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          // status move
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
    weather: undefined,
    weather_turns_left: 0,
    terrain: undefined,
    terrain_turns_left: 0,
    trick_room: false,
  });

  engine.start_battle();
  let logs = engine.run_turn({
    p1a: "taunt",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "thunderwave",
    p2a_target: 1, // Raichu is slower than Alakazam, so it will fail to use Thunder Wave!
    p2b: "tackle",
    p2b_target: 1,
  });

  let events = logs.events.map((e) => e.event);

  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "Start", target: { player: 2, slot: 0 }, effect: "taunt" }),
      expect.objectContaining({
        type: "Cant",
        target: { player: 2, slot: 0 },
        reason: "Taunt",
        move_id: "thunderwave",
      }),
    ]),
  );

  // Also expect thunderwave NOT to have been logged as "MoveUsed"
  const twaveUsed = events.find((e) => e.type === "MoveUsed" && e.move_id === "thunderwave");
  expect(twaveUsed).toBeUndefined();

  // Since Raichu acted AFTER taunt, it had not moved yet, so turns was 3.
  // At the end of the turn, it decrements to 2.
  let state = engine.get_state();
  expect(state.p2.active[0].taunt_turns).toBe(2);

  // Turn 2:
  logs = engine.run_turn({
    p1a: "tackle",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "thunderwave",
    p2a_target: 1, // Still taunted!
    p2b: "tackle",
    p2b_target: 1,
  });
  events = logs.events.map((e) => e.event);
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "Cant",
        target: { player: 2, slot: 0 },
        reason: "Taunt",
        move_id: "thunderwave",
      }),
    ]),
  );
  state = engine.get_state();
  expect(state.p2.active[0].taunt_turns).toBe(1);

  // Turn 3:
  logs = engine.run_turn({
    p1a: "tackle",
    p1a_target: 0,
    p1b: "tackle",
    p1b_target: 1,
    p2a: "thunderwave",
    p2a_target: 1, // Still taunted!
    p2b: "tackle",
    p2b_target: 1,
  });
  events = logs.events.map((e) => e.event);
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "Cant",
        target: { player: 2, slot: 0 },
        reason: "Taunt",
        move_id: "thunderwave",
      }),
      expect.objectContaining({ type: "Text", message: "|-end|p2a|move: Taunt" }),
    ]),
  );
  state = engine.get_state();
  expect(state.p2.active[0].taunt_turns).toBe(0);
  expect(state.p2.active[0].volatile_status).not.toContain("taunt");
});
