import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Shed Tail", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "orthworm", moves: ["shedtail", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["shedtail", "sleeptalk"],
    },
  );

  env.executeAndAssert("move shedtail, move sleeptalk", "move sleeptalk, move sleeptalk");
});
