import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: hydropump", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["hydropump"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move hydropump 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
