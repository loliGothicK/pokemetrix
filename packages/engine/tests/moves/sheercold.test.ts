import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sheer Cold", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "glalie", moves: ["sheercold"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move sheercold 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
