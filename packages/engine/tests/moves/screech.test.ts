import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: screech", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", moves: ["screech"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move screech 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
