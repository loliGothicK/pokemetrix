import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Lumina Crash", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "espathra", moves: ["luminacrash", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "luminacrash", accuracy: true, secondary: "always" }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit",
      },
    },
  );

  env.executeAndAssert("move luminacrash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
