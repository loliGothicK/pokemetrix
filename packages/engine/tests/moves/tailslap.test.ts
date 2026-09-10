import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Tail Slap hits multiple times", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ninetales", moves: ["tailslap"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["tailslap", "sleeptalk"],
    },
  );

  env.executeAndAssert("move tailslap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
