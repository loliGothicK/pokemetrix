import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: dragondance raises Attack and Speed by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "dragonite", ability: "multiscale", moves: ["dragondance"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["dragondance", "sleeptalk"],
    },
  );

  env.executeAndAssert("move dragondance, move sleeptalk", "move sleeptalk, move sleeptalk");
});
