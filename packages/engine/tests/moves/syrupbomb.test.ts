import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test.skip("Move: Syrup Bomb", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "hydrapple", moves: ["syrupbomb", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "syrupbomb", accuracy: true }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit",
      },
    },
  );

  env.executeAndAssert("move syrupbomb 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
