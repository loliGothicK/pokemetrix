import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Light Screen", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["lightscreen"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move lightscreen, move sleeptalk", "move sleeptalk, move sleeptalk");
});
