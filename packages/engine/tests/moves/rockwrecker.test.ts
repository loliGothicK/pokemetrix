import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rock Wrecker", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "rhyperior", moves: ["rockwrecker"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move rockwrecker 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
