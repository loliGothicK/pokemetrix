import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Ice Fang", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["icefang"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move icefang 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
