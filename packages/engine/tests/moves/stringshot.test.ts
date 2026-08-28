import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: String Shot", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ariados", moves: ["stringshot", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "stringshot", accuracy: true }, "sleeptalk"],
    },
  );

  env.executeAndAssert("move stringshot, move sleeptalk", "move sleeptalk, move sleeptalk");
});
