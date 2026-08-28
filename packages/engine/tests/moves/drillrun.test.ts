import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Drill Run", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "excadrill", moves: ["drillrun"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  // Target snorlax
  env.executeAndAssert("move drillrun 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
