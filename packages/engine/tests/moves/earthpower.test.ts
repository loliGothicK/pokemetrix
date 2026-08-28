import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: earthpower lowers target SpD", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", ability: "roughskin", moves: ["earthpower"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "earthpower", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move earthpower 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
