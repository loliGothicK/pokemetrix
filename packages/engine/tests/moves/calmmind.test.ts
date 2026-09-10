import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: calmmind raises Sp.Atk and Sp.Def by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["calmmind"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["calmmind", "sleeptalk"],
    },
  );

  env.executeAndAssert("move calmmind, move sleeptalk", "move sleeptalk, move sleeptalk");
});
