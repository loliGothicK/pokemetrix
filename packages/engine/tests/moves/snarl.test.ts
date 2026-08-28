import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: snarl", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["snarl"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move snarl, move sleeptalk", "move sleeptalk, move sleeptalk");
});
