import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Simple Beam", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "audino", moves: ["simplebeam"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move simplebeam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
