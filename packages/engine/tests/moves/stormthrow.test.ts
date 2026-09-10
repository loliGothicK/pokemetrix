import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Storm Throw", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pinsir", moves: ["stormthrow"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["stormthrow", "sleeptalk"],
    },
  );

  env.executeAndAssert("move stormthrow 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
