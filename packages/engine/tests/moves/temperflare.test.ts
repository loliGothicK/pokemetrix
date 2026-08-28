import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Temper Flare deals damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["temperflare"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["temperflare", "sleeptalk"],
    },
  );

  env.executeAndAssert("move temperflare 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
