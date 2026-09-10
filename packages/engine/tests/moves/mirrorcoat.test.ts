import { test, expect } from "vitest";
import { Simulator } from "../../pkg-node/engine.js";

test("Move: mirrorcoat (deals double special damage back to attacker)", () => {
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
          species: "blastoise",
          hp: 1000,
          maxhp: 1000,
          speed: 100,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
          ability: "torrent",
          status: undefined,
        },
        {
          ident: "p1b",
          species: "snorlax",
          hp: 1000,
          maxhp: 1000,
          speed: 100,
          attack: 10,
          defense: 10,
          sp_attack: 10,
          sp_defense: 10,
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
          speed: 200,
          attack: 10,
          defense: 10,
          sp_attack: 50,
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
    p1a: "mirrorcoat",
    p1a_target: 0,
    p1b: "sleeptalk",
    p1b_target: 0,
    p2a: "thunderbolt",
    p2a_target: 0,
    p2b: "sleeptalk",
    p2b_target: 1,
  });

  const events1 = logs1.events.map((e) => e.event);

  expect(events1).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "MoveUsed",
        move_id: "mirrorcoat",
        attacker: { player: 1, slot: 0 },
      }),
    ]),
  );
});
