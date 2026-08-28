import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Mega Kick", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["megakick"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move megakick 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
