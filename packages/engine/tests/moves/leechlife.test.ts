import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Leech Life", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["leechlife"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move leechlife 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
