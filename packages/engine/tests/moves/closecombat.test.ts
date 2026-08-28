import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: closecombat lowers user's Defense and Sp.Def by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", ability: "innerfocus", moves: ["closecombat"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["closecombat", "sleeptalk"],
    },
  );

  // Lucario uses Close Combat.
  env.executeAndAssert("move closecombat 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
