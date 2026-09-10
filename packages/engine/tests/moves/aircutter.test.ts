import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Air Cutter (エアカッター) hits all opposing Pokemon", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", ability: "blaze", moves: ["aircutter"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "umbreon", ability: "synchronize", moves: ["sleeptalk"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["aircutter", "sleeptalk"],
    },
  );

  // Spread moves don't take a specific target in Showdown execution string (they target all opponents).
  env.executeAndAssert("move aircutter, move sleeptalk", "move sleeptalk, move sleeptalk");
});
