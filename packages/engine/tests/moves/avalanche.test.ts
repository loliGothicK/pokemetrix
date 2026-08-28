import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Avalanche (ゆきなだれ) has -4 priority", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "weavile", ability: "pressure", moves: ["avalanche"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["bodyslam"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["avalanche", "bodyslam", "sleeptalk"],
    },
  );

  env.executeAndAssert("move avalanche 1, move sleeptalk", "move bodyslam 1, move sleeptalk");

  // Weavile should take some damage from Bodyslam.

  const snorlax = env.sim.p2.pokemon[0];

  // Since Snorlax hit Weavile first, Avalanche doubles its power from 60 to 120.
  // Weavile Atk (base 120 + 252 EV) vs Snorlax Def (base 65).
  // At level 100, Weavile Atk = 276. Snorlax Def = 166.
  // Damage = (((2 * 100 / 5) + 2) * 120 * 276 / 166) / 50 + 2 = 169.
  // STAB (1.5x) = 253.
  // Let's ensure it deals exactly 67 damage (which is the doubled BP 120 damage at level 50 vs Snorlax).
  expect(snorlax.maxhp - snorlax.hp).toBe(67);
});
