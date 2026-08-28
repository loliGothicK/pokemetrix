import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Ice Beam", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["icebeam"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "venusaur", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move icebeam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
