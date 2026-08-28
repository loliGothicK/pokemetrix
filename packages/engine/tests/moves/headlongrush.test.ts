import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Headlong Rush", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "torterra", moves: ["headlongrush"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move headlongrush 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
