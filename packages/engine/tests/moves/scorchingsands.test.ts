import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Scorching Sands", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["scorchingsands"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move scorchingsands 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
