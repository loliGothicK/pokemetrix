import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: pound", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "politoed", moves: ["pound"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move pound 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
