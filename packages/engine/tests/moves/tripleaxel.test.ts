import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Triple Axel hits multiple times", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ninetales", moves: ["tripleaxel"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["tripleaxel", "sleeptalk"],
    },
  );

  env.executeAndAssert("move tripleaxel 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
