import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: dazzlinggleam hits both foes", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["dazzlinggleam"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["dazzlinggleam", "sleeptalk"],
    },
  );

  env.executeAndAssert("move dazzlinggleam, move sleeptalk", "move sleeptalk, move sleeptalk");
});
