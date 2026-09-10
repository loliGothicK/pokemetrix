import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Razor Shell", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "galarian-slowbro", moves: ["razorshell"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move razorshell 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
