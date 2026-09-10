import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: lunge", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", moves: ["lunge"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move lunge 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
