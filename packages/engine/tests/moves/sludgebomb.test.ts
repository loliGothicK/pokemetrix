import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Sludge Bomb", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["sludgebomb"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move sludgebomb 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
