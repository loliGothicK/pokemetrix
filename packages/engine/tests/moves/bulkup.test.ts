import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bulkup raises Attack and Defense by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", ability: "innerfocus", moves: ["bulkup"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["bulkup", "sleeptalk"],
    },
  );

  // Snorlax uses Bulk Up.
  env.executeAndAssert("move bulkup, move sleeptalk", "move sleeptalk, move sleeptalk");
});
