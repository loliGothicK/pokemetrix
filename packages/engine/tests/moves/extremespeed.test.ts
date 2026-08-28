import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: extremespeed deals damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "dragonite", ability: "multiscale", moves: ["extremespeed"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["extremespeed", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move extremespeed 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
