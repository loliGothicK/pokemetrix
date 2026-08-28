import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: detect protects the user from moves", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", ability: "innerfocus", moves: ["detect"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["bodyslam"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["detect", "bodyslam", "sleeptalk"],
    },
  );

  // Lucario uses Detect. Opposing Snorlax uses bodyslam on Lucario but it's protected.
  env.executeAndAssert("move detect, move sleeptalk", "move bodyslam 1, move sleeptalk");
});
