import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: cottonguard raises Def by 3", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "altaria", ability: "naturalcure", moves: ["cottonguard"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["cottonguard", "sleeptalk"],
    },
  );

  env.executeAndAssert("move cottonguard, move sleeptalk", "move sleeptalk, move sleeptalk");
});
