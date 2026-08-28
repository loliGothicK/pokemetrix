import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: charm lowers target's Attack by 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["charm"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["charm", "sleeptalk"],
    },
  );

  // Clefable uses Charm on Snorlax
  env.executeAndAssert("move charm 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
