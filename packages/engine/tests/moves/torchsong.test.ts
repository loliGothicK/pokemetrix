import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Torch Song", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "skeledirge", moves: ["torchsong", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "torchsong", accuracy: true, secondary: "always" }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit",
      },
    },
  );

  env.executeAndAssert("move torchsong 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
