import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: lavaplume", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "flareon", moves: ["lavaplume"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move lavaplume, move sleeptalk", "move sleeptalk, move sleeptalk");
});
