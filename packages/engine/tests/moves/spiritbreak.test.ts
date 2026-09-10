import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Spirit Break", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "grimmsnarl", moves: ["spiritbreak", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [
        { id: "spiritbreak", accuracy: true, secondary: "inherit" },
        "sleeptalk",
      ],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit",
      },
    },
  );

  env.executeAndAssert("move spiritbreak 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
