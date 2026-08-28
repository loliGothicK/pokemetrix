import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Worry Seed", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur", moves: ["worryseed", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "worryseed", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always" },
    },
  );

  env.executeAndAssert("move worryseed 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
