import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: featherdance lowers target Atk by 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["featherdance"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["featherdance", "sleeptalk"],
    },
  );

  env.executeAndAssert("move featherdance 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
