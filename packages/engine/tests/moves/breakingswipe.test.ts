import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: breakingswipe hits both opponents and lowers their Attack", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", ability: "roughskin", moves: ["breakingswipe"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "breakingswipe", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  // Garchomp uses Breaking Swipe. It hits Pikachu and Venusaur, lowering their Attack.
  env.executeAndAssert("move breakingswipe, move sleeptalk", "move sleeptalk, move sleeptalk");
});
