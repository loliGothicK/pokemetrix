import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: moonlight", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["moonlight"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "machamp", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move moonlight, move sleeptalk", "move sleeptalk, move sleeptalk");
});
