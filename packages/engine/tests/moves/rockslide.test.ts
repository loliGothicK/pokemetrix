import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rock Slide", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["rockslide"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move rockslide, move sleeptalk", "move sleeptalk, move sleeptalk");
});
