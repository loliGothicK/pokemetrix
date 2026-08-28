import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Eerie Spell", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "slowking", moves: ["eeriespell", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["bodyslam", "sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  // Turn 1: Tauros uses Body Slam, Slowking uses Eerie Spell.
  // Eerie Spell should reduce Tauros's Body Slam PP by 3.
  const res = env.executeTurn(
    "move eeriespell 1, move sleeptalk",
    "move bodyslam 1, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);
});
