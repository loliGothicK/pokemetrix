import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Water Shuriken hits 2-5 times", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "greninja", moves: ["watershuriken"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move watershuriken 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
