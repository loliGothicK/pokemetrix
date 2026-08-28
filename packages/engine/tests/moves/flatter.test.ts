import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Flatter", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "feraligatr", moves: ["flatter"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move flatter 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
