import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: leafstorm", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["leafstorm"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move leafstorm 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
