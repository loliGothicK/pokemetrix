import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sparkling Aria", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "primarina", moves: ["sparklingaria", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "sparklingaria", accuracy: true }, "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never" },
    },
  );

  env.executeAndAssert("move sparklingaria, move sleeptalk", "move sleeptalk, move sleeptalk");
});
