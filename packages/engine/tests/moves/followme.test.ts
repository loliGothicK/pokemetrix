import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Follow Me", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["followme"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["flamethrower"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  // Charizard targets Snorlax (slot 1), but Togekiss (slot 0) uses Follow Me
  env.executeAndAssert("move followme, move sleeptalk", "move flamethrower 1, move sleeptalk");
});
