import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: dracometeor lowers user's Sp.Atk by 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "dragonite", ability: "multiscale", moves: ["dracometeor"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["dracometeor", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // Latios uses Draco Meteor.
  env.executeAndAssert("move dracometeor 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
