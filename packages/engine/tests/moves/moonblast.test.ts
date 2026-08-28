import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: moonblast", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["moonblast"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "machamp", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move moonblast 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
