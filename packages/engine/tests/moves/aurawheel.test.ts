import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aura Wheel (オーラぐるま) deals damage and boosts the user's Speed by 1 stage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "morpeko-full-belly", moves: ["aurawheel", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn("move aurawheel 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.assertStateMatch(res.engineState, env.sim);
});
