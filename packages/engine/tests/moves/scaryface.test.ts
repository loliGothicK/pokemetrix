import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Scary Face", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["scaryface"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move scaryface 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
