import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: liquidation", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["liquidation"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move liquidation 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
