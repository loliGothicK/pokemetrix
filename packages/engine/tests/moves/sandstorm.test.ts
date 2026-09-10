import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: sandstorm", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["sandstorm"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move sandstorm, move sleeptalk", "move sleeptalk, move sleeptalk");
});
