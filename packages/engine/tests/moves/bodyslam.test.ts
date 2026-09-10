import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bodyslam has chance to paralyze", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["bodyslam"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
      pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "bodyslam", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  // Snorlax uses Body Slam.
  // Because secondary: "always", it should paralyze.
  env.executeAndAssert("move bodyslam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
