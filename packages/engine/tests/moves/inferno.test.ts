import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: inferno", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["inferno"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move inferno 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
