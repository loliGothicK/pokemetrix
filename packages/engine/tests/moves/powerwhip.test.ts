import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Power Whip", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["powerwhip"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move powerwhip 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
