import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: dragonclaw deals damage without secondary effects", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", ability: "roughskin", moves: ["dragonclaw"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["dragonclaw", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // Garchomp uses Dragon Claw.
  env.executeAndAssert("move dragonclaw 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
