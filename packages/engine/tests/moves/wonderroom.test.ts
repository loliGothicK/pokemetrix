import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Wonder Room", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["wonderroom", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["wonderroom", "sleeptalk"],
    },
  );

  env.executeAndAssert("move wonderroom, move sleeptalk", "move sleeptalk, move sleeptalk");
});
