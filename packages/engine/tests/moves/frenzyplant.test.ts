import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Frenzy Plant", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["frenzyplant"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move frenzyplant 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
