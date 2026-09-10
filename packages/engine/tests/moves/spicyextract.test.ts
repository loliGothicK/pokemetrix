import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Spicy Extract", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "scovillain", moves: ["spicyextract", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "spicyextract", accuracy: true }, "sleeptalk"],
    },
  );

  env.executeAndAssert("move spicyextract 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
