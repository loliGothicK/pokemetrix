import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: waterfall", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["waterfall"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move waterfall 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
