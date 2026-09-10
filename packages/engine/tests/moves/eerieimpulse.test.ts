import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: eerieimpulse lowers target SpA by 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["eerieimpulse"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["eerieimpulse", "sleeptalk"],
    },
  );

  env.executeAndAssert("move eerieimpulse 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
