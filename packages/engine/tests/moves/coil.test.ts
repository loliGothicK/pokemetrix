import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: coil raises Attack, Defense, Accuracy by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "serperior", ability: "overgrow", moves: ["coil"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["coil", "sleeptalk"],
    },
  );

  env.executeAndAssert("move coil, move sleeptalk", "move sleeptalk, move sleeptalk");
});
