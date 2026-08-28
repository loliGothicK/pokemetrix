import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bulldoze hits all adjacent pokemon and lowers their Speed", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", ability: "roughskin", moves: ["bulldoze"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "bulldoze", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  // Garchomp uses Bulldoze. It hits Snorlax (foe), Venusaur (foe), AND Snorlax (ally).
  env.executeAndAssert("move bulldoze, move sleeptalk", "move sleeptalk, move sleeptalk");
});
