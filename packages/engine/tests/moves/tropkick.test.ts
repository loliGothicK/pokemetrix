import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Trop Kick", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "tsareena", moves: ["tropkick", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "tropkick", accuracy: true, secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "inherit",
      },
    },
  );

  env.executeAndAssert("move tropkick 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
