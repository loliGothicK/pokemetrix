import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Mortal Spin", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "glimmora", moves: ["mortalspin", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "mortalspin", accuracy: true, secondary: "always" }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit",
      },
    },
  );

  env.executeAndAssert("move mortalspin, move sleeptalk", "move sleeptalk, move sleeptalk");
});
