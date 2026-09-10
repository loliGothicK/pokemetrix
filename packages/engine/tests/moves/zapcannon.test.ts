import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Zap Cannon", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "raichu", moves: ["zapcannon", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "zapcannon", accuracy: true, secondary: "always" }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit",
      },
    },
  );

  env.executeAndAssert("move zapcannon 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
