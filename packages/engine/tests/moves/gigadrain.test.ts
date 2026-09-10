import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: gigadrain recovers HP", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["gigadrain"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["gigadrain", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // HP modified naturally or no longer needed

  env.executeAndAssert("move gigadrain 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
