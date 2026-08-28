import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Apple Acid (りんごさん) lowers target's SpD by 1 stage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "appletun", ability: "ripen", moves: ["appleacid"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "appleacid", secondary: "inherit", basePower: 90 }, "sleeptalk"],
      engineConfig: { secondary: "always" },
    },
  );

  env.executeAndAssert("move appleacid 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  const pikachu = env.sim.p2.pokemon[0];
  expect(pikachu.boosts.spd).toBe(-1);
});
