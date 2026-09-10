import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Teeter Dance", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lopunny", moves: ["teeterdance", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "teeterdance", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always" },
    },
  );

  env.executeAndAssert("move teeterdance, move sleeptalk", "move sleeptalk, move sleeptalk");
});
