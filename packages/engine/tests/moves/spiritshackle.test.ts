import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Spirit Shackle", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "decidueye", moves: ["spiritshackle", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "spiritshackle", accuracy: true }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit",
      },
    },
  );

  env.executeAndAssert("move spiritshackle 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
