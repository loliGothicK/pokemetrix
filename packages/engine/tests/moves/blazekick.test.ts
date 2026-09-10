import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: blazekick has high critical hit ratio and chance to burn", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blaziken", ability: "blaze", moves: ["blazekick"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "blazekick", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  // Blaziken uses Blaze Kick.
  // Because secondary: "always", it should burn.
  env.executeAndAssert("move blazekick 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
