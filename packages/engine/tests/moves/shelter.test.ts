import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: shelter", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "goodra", moves: ["shelter"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move shelter, move sleeptalk", "move sleeptalk, move sleeptalk");
});
