import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: cosmicpower raises Def and Sp.Def by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["cosmicpower"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["cosmicpower", "sleeptalk"],
    },
  );

  env.executeAndAssert("move cosmicpower, move sleeptalk", "move sleeptalk, move sleeptalk");
});
