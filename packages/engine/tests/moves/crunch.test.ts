import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: crunch has chance to lower Defense", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["crunch"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "crunch", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  // Snorlax uses Crunch on opposing Snorlax.
  env.executeAndAssert("move crunch 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
