import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: megahorn", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "heracross", moves: ["megahorn"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move megahorn 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
