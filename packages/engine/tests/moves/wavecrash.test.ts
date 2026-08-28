import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Wave Crash deals damage with recoil", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["wavecrash"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["wavecrash", "sleeptalk"],
    },
  );

  env.executeAndAssert("move wavecrash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
