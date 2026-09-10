import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Tri Attack", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["triattack", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["triattack", "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "never",
      },
    },
  );

  env.executeAndAssert("move triattack 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
