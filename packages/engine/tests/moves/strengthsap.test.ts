import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Strength Sap", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "polteageist", moves: ["strengthsap", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "strengthsap", accuracy: true }, "sleeptalk"],
    },
  );

  env.executeAndAssert("move strengthsap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
