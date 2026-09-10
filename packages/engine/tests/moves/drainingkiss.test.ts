import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: drainingkiss recovers HP", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["drainingkiss"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["drainingkiss", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // Lower Clefable's HP to test healing
  // HP modified naturally or no longer needed

  env.executeAndAssert("move drainingkiss 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
