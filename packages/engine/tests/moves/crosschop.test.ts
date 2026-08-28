import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Cross Chop", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "machamp", moves: ["crosschop"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move crosschop 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
