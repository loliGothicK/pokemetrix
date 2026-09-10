import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: brutalswing hits all adjacent pokemon", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", ability: "roughskin", moves: ["brutalswing"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["brutalswing", "sleeptalk"],
    },
  );

  // Garchomp uses Brutal Swing. It hits Pikachu, Venusaur, AND Snorlax (ally).
  env.executeAndAssert("move brutalswing, move sleeptalk", "move sleeptalk, move sleeptalk");
});
