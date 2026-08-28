import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Shadow Ball", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["shadowball"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move shadowball 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
