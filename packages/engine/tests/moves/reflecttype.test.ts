import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Reflect Type", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", moves: ["reflecttype"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move reflecttype 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
