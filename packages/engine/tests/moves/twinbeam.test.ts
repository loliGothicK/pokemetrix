import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Twin Beam hits twice", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "farigiraf", moves: ["twinbeam"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["twinbeam", "sleeptalk"],
    },
  );

  env.executeAndAssert("move twinbeam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
