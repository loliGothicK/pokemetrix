import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Topsy-Turvy", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "malamar", moves: ["topsyturvy", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["bellydrum", "sleeptalk"] }),
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["topsyturvy", "bellydrum", "sleeptalk"],
    },
  );

  env.executeTurn("move sleeptalk, move sleeptalk", "move bellydrum, move sleeptalk");
  env.executeAndAssert("move topsyturvy 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
