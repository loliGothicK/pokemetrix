import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Psychic Terrain fails if already active", () => {
  const env = new TestEnvironment(
    [
      pokemon({
        species: "alakazam",
        ability: "synchronize",
        moves: ["psychicterrain", "sleeptalk"],
      }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "psychicterrain", damage_roll: "max" }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move psychicterrain, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move psychicterrain, move sleeptalk", "move sleeptalk, move sleeptalk");
});
