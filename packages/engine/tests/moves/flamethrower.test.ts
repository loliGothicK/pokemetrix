import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: flamethrower deals damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", ability: "blaze", moves: ["flamethrower"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["flamethrower", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move flamethrower 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
