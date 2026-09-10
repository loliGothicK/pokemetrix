import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sunny Day", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ninetales", moves: ["sunnyday", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move sunnyday, move sleeptalk", "move sleeptalk, move sleeptalk");
});
