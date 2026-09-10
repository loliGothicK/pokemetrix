import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: iceshard deals damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "mamoswine", ability: "oblivious", moves: ["iceshard"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["iceshard", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move iceshard 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
