import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Head Smash", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arcanine", moves: ["headsmash"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move headsmash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
