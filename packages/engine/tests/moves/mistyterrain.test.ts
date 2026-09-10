import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Misty Terrain fails if already active", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["mistyterrain", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "mistyterrain", damage_roll: "max" }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move mistyterrain, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move mistyterrain, move sleeptalk", "move sleeptalk, move sleeptalk");
});
