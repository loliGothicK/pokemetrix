import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: wrap", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["wrap"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move wrap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
