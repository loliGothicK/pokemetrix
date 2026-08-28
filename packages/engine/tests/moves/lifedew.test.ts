import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Life Dew", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["lifedew"] }),
      pokemon({ species: "snorlax", hp: 180, moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  const result = env.executeTurn("move lifedew, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.assertStateMatch(result.engineState, env.sim);
});
