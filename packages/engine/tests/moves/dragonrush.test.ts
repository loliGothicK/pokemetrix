import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Dragon Rush has a 20% chance to flinch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", moves: ["dragonrush"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "dragonrush", secondary: "inherit" }, "sleeptalk"],
      engineConfig: { secondary: "always" },
    },
  );

  // Target snorlax
  env.executeAndAssert("move dragonrush 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
