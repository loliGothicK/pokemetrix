import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: electroweb hits all adjacent and lowers Speed", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["electroweb"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "electroweb", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move electroweb, move sleeptalk", "move sleeptalk, move sleeptalk");
});
