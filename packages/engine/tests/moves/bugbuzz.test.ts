import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bugbuzz has chance to lower Special Defense", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "volcarona", ability: "flamebody", moves: ["bugbuzz"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "bugbuzz", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  // Volcarona uses Bug Buzz. It lowers Snorlax's Sp. Def.
  env.executeAndAssert("move bugbuzz 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
