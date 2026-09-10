import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aqua Step (アクアステップ) deals damage and boosts the user's Speed by 1 stage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "quaquaval", moves: ["aquastep", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "arcanine", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thick-fat", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn("move aquastep 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.assertStateMatch(res.engineState, env.sim);
});
