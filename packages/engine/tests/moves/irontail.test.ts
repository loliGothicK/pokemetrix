import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Iron Tail", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["irontail"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move irontail 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
