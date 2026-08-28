import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Petal Blizzard", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["petalblizzard"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move petalblizzard, move sleeptalk", "move sleeptalk, move sleeptalk");
});
