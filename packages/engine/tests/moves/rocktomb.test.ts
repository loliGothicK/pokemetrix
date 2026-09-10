import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rock Tomb", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["rocktomb"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move rocktomb 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
