import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: boomburst hits all adjacent pokemon", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "noivern", ability: "infiltrator", moves: ["boomburst"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["boomburst", "sleeptalk"],
    },
  );

  // Noivern uses Boomburst. It hits Pikachu, Venusaur, AND Snorlax (ally).
  env.executeAndAssert("move boomburst, move sleeptalk", "move sleeptalk, move sleeptalk");
});
