import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Horn Drill", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "rhyperior", moves: ["horndrill"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move horndrill 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
