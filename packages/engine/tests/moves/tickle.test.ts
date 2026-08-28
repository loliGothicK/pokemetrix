import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: tickle", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", moves: ["tickle"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move tickle 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
