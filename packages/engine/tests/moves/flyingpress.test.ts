import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Flying Press", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "hawlucha", moves: ["flyingpress"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "venusaur", moves: ["sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move flyingpress 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
