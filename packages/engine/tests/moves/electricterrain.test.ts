import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Electric Terrain fails if already active", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["electricterrain", "sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "electricterrain", damage_roll: "max" }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Turn 1 sets Electric Terrain
  env.executeAndAssert("move electricterrain, move sleeptalk", "move sleeptalk, move sleeptalk");
  // Turn 2 fails
  env.executeAndAssert("move electricterrain, move sleeptalk", "move sleeptalk, move sleeptalk");
});
