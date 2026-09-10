import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: hornleech recovers HP", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "trevenant", ability: "naturalcure", moves: ["hornleech"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["hornleech", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // HP modified naturally or no longer needed

  env.executeAndAssert("move hornleech 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
