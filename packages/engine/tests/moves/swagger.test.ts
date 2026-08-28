import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: swagger", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "tauros", moves: ["swagger"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move swagger 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
