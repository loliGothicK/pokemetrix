import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: drillpeck deals damage without secondary effects", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "corviknight", ability: "mirrorarmor", moves: ["drillpeck"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["drillpeck", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move drillpeck 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
