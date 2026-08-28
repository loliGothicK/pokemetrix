import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Stuff Cheeks", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "simisear", item: "sitrusberry", moves: ["stuffcheeks", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["stuffcheeks", "sleeptalk"],
    },
  );

  env.executeAndAssert("move stuffcheeks, move sleeptalk", "move sleeptalk, move sleeptalk");
});
