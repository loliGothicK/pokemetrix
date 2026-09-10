import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: hypervoice hits all adjacent foes", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["hypervoice"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["hypervoice", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move hypervoice, move sleeptalk", "move sleeptalk, move sleeptalk");
});
