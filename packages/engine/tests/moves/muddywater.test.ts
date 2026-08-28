import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Muddy Water", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["muddywater"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move muddywater, move sleeptalk", "move sleeptalk, move sleeptalk");
});
