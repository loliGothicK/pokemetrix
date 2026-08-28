import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bite causes flinch and prevents target from moving", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", ability: "blaze", moves: ["bite"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "bite", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
      },
    },
  );

  // Charizard (100) > Venusaur (80)
  // Charizard uses Bite on Venusaur.
  // Venusaur flinches and cannot use Sleep Talk.
  env.executeAndAssert("move bite 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
