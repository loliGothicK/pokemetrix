import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: trailblaze", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["trailblaze"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move trailblaze 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
