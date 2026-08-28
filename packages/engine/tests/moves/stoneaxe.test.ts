import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Stone Axe", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "kleavor", moves: ["stoneaxe", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "stoneaxe", accuracy: true }, "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never", accuracy: "always" },
    },
  );

  const res = env.executeTurn("move stoneaxe 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.assertStateMatch(res.engineState, env.sim);
});
