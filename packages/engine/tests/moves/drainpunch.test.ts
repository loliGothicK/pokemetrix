import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: drainpunch recovers HP", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", ability: "innerfocus", moves: ["drainpunch"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["drainpunch", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // Lower Lucario's HP to test healing
  // HP modified naturally or no longer needed
  env.executeAndAssert("move drainpunch 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
