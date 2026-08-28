import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: fireblast deals damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", ability: "blaze", moves: ["fireblast"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["fireblast", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move fireblast 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
