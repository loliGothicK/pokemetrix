import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: infestation", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ariados", moves: ["infestation"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move infestation 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
