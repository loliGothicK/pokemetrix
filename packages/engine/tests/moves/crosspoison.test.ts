import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Cross Poison", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "toxicroak", moves: ["crosspoison", "crosschop"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move crosspoison 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move crosschop 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
