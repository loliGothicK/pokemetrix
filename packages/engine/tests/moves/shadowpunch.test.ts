import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Shadow Punch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", moves: ["shadowpunch"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move shadowpunch 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
