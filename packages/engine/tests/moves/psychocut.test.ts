import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Psycho Cut deals damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "medicham", moves: ["psychocut"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["psychocut", "sleeptalk"],
    },
  );

  env.executeAndAssert("move psychocut 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
